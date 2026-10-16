<?php

namespace App\Services\Auth;

use App\Models\BusinessListing;
use App\Models\CatchUpBrief;
use App\Models\CommunityGroup;
use App\Models\CommunityGroupMembership;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\LoginOtp;
use App\Models\Message;
use App\Models\ProfileCard;
use App\Models\StatusItem;
use App\Models\User;
use App\Models\VerificationSubmission;
use App\Support\CommunityGroupMembershipStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Permanently deletes a user (App Store guideline 5.1.1(v)).
 *
 * Database rows that reference the user cascade through their foreign keys
 * (messages, participants, statuses, profile cards, listings, links, blocks).
 * Uploaded files and API tokens do not, so they are removed here first.
 */
class AccountDeletionService
{
    public function delete(User $user): void
    {
        $files = $this->collectFiles($user);

        DB::transaction(function () use ($user) {
            $conversationIds = ConversationParticipant::query()
                ->where('user_id', $user->id)
                ->pluck('conversation_id')
                ->all();

            $this->handOverCommunityGroups($user);

            $user->tokens()->delete();

            LoginOtp::query()
                ->whereIn('identifier', array_values(array_filter([$user->email, $user->phone])))
                ->delete();

            // Other people's AI summaries may quote this user; they regenerate.
            CatchUpBrief::query()->whereIn('conversation_id', $conversationIds)->delete();

            $user->delete();

            // The user's messages are gone (cascade); fix list previews that showed them.
            $this->refreshLastMessages($conversationIds);
        });

        $this->deleteFiles($user, $files);

        Log::info('gocha.account.deleted', ['user_id' => $user->id]);
    }

    /**
     * Community groups survive their owner: the longest-standing approved
     * member takes over. Groups with no other member are deleted with the owner.
     */
    private function handOverCommunityGroups(User $user): void
    {
        CommunityGroup::query()->where('owner_user_id', $user->id)->get()
            ->each(function (CommunityGroup $group) use ($user) {
                $successor = CommunityGroupMembership::query()
                    ->where('community_group_id', $group->id)
                    ->where('user_id', '!=', $user->id)
                    ->where('status', CommunityGroupMembershipStatus::APPROVED)
                    ->orderBy('decided_at')
                    ->orderBy('id')
                    ->first();

                if (! $successor) {
                    return;
                }

                $successor->forceFill(['role' => 'owner'])->save();
                $remaining = CommunityGroupMembership::query()
                    ->where('community_group_id', $group->id)
                    ->where('user_id', '!=', $user->id)
                    ->where('status', CommunityGroupMembershipStatus::APPROVED)
                    ->count();
                $group->forceFill([
                    'owner_user_id' => $successor->user_id,
                    'member_count' => max(1, $remaining),
                ])->save();

                if ($group->conversation_id) {
                    Conversation::query()
                        ->whereKey($group->conversation_id)
                        ->where('created_by_user_id', $user->id)
                        ->update(['created_by_user_id' => $successor->user_id]);
                }
            });
    }

    /**
     * @param  array<int, int>  $conversationIds
     */
    private function refreshLastMessages(array $conversationIds): void
    {
        Conversation::query()->whereIn('id', $conversationIds)->get()
            ->each(function (Conversation $conversation) {
                $latest = Message::query()
                    ->where('conversation_id', $conversation->id)
                    ->whereNull('deleted_at')
                    ->orderByDesc('id')
                    ->first();

                $conversation->forceFill([
                    'last_message_body' => $latest?->body,
                    'last_message_at' => $latest?->created_at,
                    'last_message_sender_user_id' => $latest?->sender_user_id,
                ])->save();
            });
    }

    /**
     * @return array<int, string>
     */
    private function collectFiles(User $user): array
    {
        $paths = [$user->avatar_path];

        StatusItem::query()->where('user_id', $user->id)->pluck('media_path')
            ->each(function ($path) use (&$paths) {
                $paths[] = $path;
            });

        ProfileCard::query()->where('user_id', $user->id)->pluck('photo_path')
            ->each(function ($path) use (&$paths) {
                $paths[] = $path;
            });

        $listingIds = BusinessListing::query()->where('owner_user_id', $user->id)->pluck('id');
        VerificationSubmission::query()
            ->where('user_id', $user->id)
            ->orWhereIn('business_listing_id', $listingIds)
            ->pluck('document_path')
            ->each(function ($path) use (&$paths) {
                $paths[] = $path;
            });

        BusinessListing::query()->where('owner_user_id', $user->id)->get(['cover_photo_path', 'logo_photo_path'])
            ->each(function (BusinessListing $listing) use (&$paths) {
                $paths[] = $listing->cover_photo_path;
                $paths[] = $listing->logo_photo_path;
            });

        return array_values(array_filter($paths, fn ($path) => is_string($path) && $path !== ''));
    }

    /**
     * @param  array<int, string>  $files
     */
    private function deleteFiles(User $user, array $files): void
    {
        try {
            $disk = Storage::disk('public');
            if ($files !== []) {
                $disk->delete($files);
            }
            $disk->deleteDirectory('conversation-media/'.$user->id);
            $disk->deleteDirectory('conversation-posts/'.$user->id);
        } catch (Throwable $e) {
            // The account is already gone; leftover files must not fail the request.
            Log::warning('gocha.account.delete_files_failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
