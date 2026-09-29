<?php

namespace App\Services\Groups;

use App\Models\CommunityGroup;
use App\Models\CommunityGroupMembership;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use App\Support\CommunityGroupMembershipStatus;
use App\Support\ConversationType;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityGroupJoinService
{
    public function addOwnerMembership(CommunityGroup $group, User $owner): CommunityGroupMembership
    {
        return CommunityGroupMembership::query()->firstOrCreate(
            [
                'community_group_id' => $group->id,
                'user_id' => $owner->id,
            ],
            [
                'status' => CommunityGroupMembershipStatus::APPROVED,
                'role' => 'owner',
                'requested_at' => now(),
                'decided_at' => now(),
            ],
        );
    }

    public function syncConversationMembers(CommunityGroup $group): void
    {
        if (! $group->conversation_id) {
            return;
        }

        $participantIds = ConversationParticipant::query()
            ->where('conversation_id', $group->conversation_id)
            ->pluck('user_id');

        foreach ($participantIds as $userId) {
            if ((int) $userId === (int) $group->owner_user_id) {
                continue;
            }

            CommunityGroupMembership::query()->firstOrCreate(
                [
                    'community_group_id' => $group->id,
                    'user_id' => $userId,
                ],
                [
                    'status' => CommunityGroupMembershipStatus::APPROVED,
                    'role' => 'member',
                    'requested_at' => now(),
                    'decided_at' => now(),
                ],
            );
        }

        $group->forceFill([
            'member_count' => max(1, $this->approvedCount($group)),
        ])->save();
    }

    public function requestJoin(CommunityGroup $group, User $user): CommunityGroupMembership
    {
        if ((int) $group->owner_user_id === (int) $user->id) {
            throw ValidationException::withMessages([
                'group' => ['You already own this group.'],
            ]);
        }

        if (! $group->isPublic()) {
            throw new AuthorizationException('This group is invite-only.');
        }

        $membership = CommunityGroupMembership::query()->firstOrNew([
            'community_group_id' => $group->id,
            'user_id' => $user->id,
        ]);

        if ($membership->isApproved()) {
            throw ValidationException::withMessages([
                'group' => ['You are already a member of this group.'],
            ]);
        }

        $membership->forceFill([
            'status' => CommunityGroupMembershipStatus::PENDING,
            'role' => 'member',
            'requested_at' => $membership->requested_at ?? now(),
            'decided_at' => null,
        ])->save();

        return $membership->fresh(['user', 'group']);
    }

    public function approve(CommunityGroupMembership $membership, User $owner): CommunityGroupMembership
    {
        $group = $membership->group()->firstOrFail();
        $this->assertOwner($group, $owner);

        if ($membership->isApproved()) {
            return $membership->fresh(['user', 'group']);
        }

        return DB::transaction(function () use ($membership, $group) {
            $membership->forceFill([
                'status' => CommunityGroupMembershipStatus::APPROVED,
                'role' => 'member',
                'decided_at' => now(),
            ])->save();

            $group->forceFill([
                'member_count' => max(1, $this->approvedCount($group)),
            ])->save();

            $this->addToConversation($group, (int) $membership->user_id);

            return $membership->fresh(['user', 'group']);
        });
    }

    public function decline(CommunityGroupMembership $membership, User $owner): CommunityGroupMembership
    {
        $group = $membership->group()->firstOrFail();
        $this->assertOwner($group, $owner);

        $membership->forceFill([
            'status' => CommunityGroupMembershipStatus::DECLINED,
            'decided_at' => now(),
        ])->save();

        return $membership->fresh(['user', 'group']);
    }

    /** @return Collection<int, CommunityGroupMembership> */
    public function pendingForGroup(CommunityGroup $group, User $owner): Collection
    {
        $this->assertOwner($group, $owner);

        return CommunityGroupMembership::query()
            ->where('community_group_id', $group->id)
            ->where('status', CommunityGroupMembershipStatus::PENDING)
            ->with('user')
            ->orderByDesc('requested_at')
            ->get();
    }

    public function membershipStatus(CommunityGroup $group, ?User $viewer, ?CommunityGroupMembership $membership): string
    {
        if (! $viewer) {
            return 'none';
        }

        if ((int) $group->owner_user_id === (int) $viewer->id) {
            return 'owner';
        }

        if ($membership?->isApproved()) {
            return 'member';
        }

        if ($membership?->isPending()) {
            return 'pending';
        }

        return 'none';
    }

    private function approvedCount(CommunityGroup $group): int
    {
        $count = CommunityGroupMembership::query()
            ->where('community_group_id', $group->id)
            ->where('status', CommunityGroupMembershipStatus::APPROVED)
            ->count();

        if ($count === 0) {
            return 1;
        }

        return $count;
    }

    private function addToConversation(CommunityGroup $group, int $userId): void
    {
        if (! $group->conversation_id) {
            return;
        }

        $conversation = Conversation::query()->find($group->conversation_id);
        if (! $conversation || $conversation->type !== ConversationType::GROUP) {
            return;
        }

        $exists = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $userId)
            ->exists();
        if ($exists) {
            return;
        }

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userId,
        ]);
    }

    private function assertOwner(CommunityGroup $group, User $user): void
    {
        if ((int) $group->owner_user_id !== (int) $user->id) {
            throw new AuthorizationException('You can only manage your own groups.');
        }
    }
}
