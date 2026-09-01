<?php

namespace App\Services\Status;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\StatusItem;
use App\Models\StatusView;
use App\Models\User;
use App\Support\ConversationType;
use App\Support\StatusType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class StatusService
{
    /**
     * @return Collection<int, int>
     */
    public function contactIds(User $user): Collection
    {
        $conversationIds = ConversationParticipant::query()
            ->where('user_id', $user->id)
            ->whereIn('conversation_id', Conversation::query()->where('type', ConversationType::DM)->select('id'))
            ->pluck('conversation_id');

        if ($conversationIds->isEmpty()) {
            return collect();
        }

        return ConversationParticipant::query()
            ->whereIn('conversation_id', $conversationIds)
            ->where('user_id', '!=', $user->id)
            ->pluck('user_id')
            ->unique()
            ->values();
    }

    public function canView(User $viewer, User $owner): bool
    {
        if ((int) $viewer->id === (int) $owner->id) {
            return true;
        }

        return $this->contactIds($viewer)->contains((int) $owner->id);
    }

    /**
     * @param  Collection<int, int>|array<int, int>  $userIds
     * @return array<int, array{hasStatus: bool, unseen: bool}>
     */
    public function summariesForUsers(User $viewer, $userIds): array
    {
        $ids = collect($userIds)->filter()->map(fn ($id) => (int) $id)->unique()->values();
        $empty = [];
        foreach ($ids as $id) {
            $empty[$id] = ['hasStatus' => false, 'unseen' => false];
        }

        if ($ids->isEmpty()) {
            return $empty;
        }

        $items = StatusItem::query()
            ->active()
            ->whereIn('user_id', $ids)
            ->with(['views' => fn ($query) => $query->where('viewer_user_id', $viewer->id)])
            ->get()
            ->groupBy('user_id');

        foreach ($items as $userId => $group) {
            $empty[(int) $userId] = [
                'hasStatus' => $group->isNotEmpty(),
                'unseen' => $group->contains(fn (StatusItem $item) => ! $item->isViewedBy($viewer)),
            ];
        }

        return $empty;
    }

    /**
     * @return array{mine: array<string, mixed>, recent: list<array<string, mixed>>}
     */
    public function feed(User $viewer): array
    {
        $mineItems = StatusItem::query()
            ->active()
            ->where('user_id', $viewer->id)
            ->with('views')
            ->orderBy('created_at')
            ->get();

        $contactIds = $this->contactIds($viewer);
        $recent = [];
        if ($contactIds->isNotEmpty()) {
            $grouped = StatusItem::query()
                ->active()
                ->whereIn('user_id', $contactIds)
                ->with(['user', 'views' => fn ($query) => $query->where('viewer_user_id', $viewer->id)])
                ->orderBy('created_at')
                ->get()
                ->groupBy('user_id');

            foreach ($grouped as $items) {
                $owner = $items->first()?->user;
                if (! $owner) {
                    continue;
                }
                $recent[] = $this->authorPayload($owner, $items, $viewer);
            }

            usort($recent, function (array $a, array $b) {
                if (($a['unseenCount'] > 0) !== ($b['unseenCount'] > 0)) {
                    return $a['unseenCount'] > 0 ? -1 : 1;
                }

                return strcmp((string) $b['latestAt'], (string) $a['latestAt']);
            });
        }

        return [
            'mine' => $this->authorPayload($viewer, $mineItems, $viewer),
            'recent' => array_values($recent),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function itemsForUser(User $owner, User $viewer): array
    {
        if (! $this->canView($viewer, $owner)) {
            abort(403, 'You cannot view this status.');
        }

        $includeViewers = (int) $owner->id === (int) $viewer->id;

        return StatusItem::query()
            ->active()
            ->where('user_id', $owner->id)
            ->with('views')
            ->orderBy('created_at')
            ->get()
            ->map(fn (StatusItem $item) => $item->toViewerPayload($viewer, $includeViewers))
            ->values()
            ->all();
    }

    public function createText(User $user, string $text, ?string $backgroundColor): StatusItem
    {
        $this->assertRoom($user);

        $color = $backgroundColor && in_array($backgroundColor, StatusType::backgrounds(), true)
            ? $backgroundColor
            : StatusType::backgrounds()[0];

        return StatusItem::query()->create([
            'user_id' => $user->id,
            'type' => StatusType::TEXT,
            'body' => $text,
            'background_color' => $color,
            'duration_ms' => StatusType::TEXT_DURATION_MS,
            'expires_at' => now()->addHours(StatusType::LIFETIME_HOURS),
        ]);
    }

    public function createMedia(
        User $user,
        UploadedFile $file,
        string $type,
        ?string $caption,
        ?int $durationMs,
    ): StatusItem {
        $this->assertRoom($user);

        if (! in_array($type, [StatusType::IMAGE, StatusType::VIDEO], true)) {
            throw ValidationException::withMessages([
                'type' => ['Status media must be an image or a video.'],
            ]);
        }

        $path = $file->store('statuses/'.$user->id, 'public');
        $duration = StatusType::defaultDuration($type);
        if ($type === StatusType::VIDEO && $durationMs) {
            $duration = max(3000, min(StatusType::VIDEO_MAX_MS, $durationMs));
        }

        return StatusItem::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'body' => $caption,
            'media_path' => $path,
            'background_color' => StatusType::backgrounds()[0],
            'duration_ms' => $duration,
            'expires_at' => now()->addHours(StatusType::LIFETIME_HOURS),
        ]);
    }

    public function markViewed(StatusItem $item, User $viewer): void
    {
        if ((int) $item->user_id === (int) $viewer->id) {
            return;
        }

        if (! $item->isActive()) {
            return;
        }

        $owner = $item->user ?: User::query()->findOrFail($item->user_id);
        if (! $this->canView($viewer, $owner)) {
            abort(403, 'You cannot view this status.');
        }

        StatusView::query()->firstOrCreate(
            [
                'status_item_id' => $item->id,
                'viewer_user_id' => $viewer->id,
            ],
            ['viewed_at' => now()],
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function viewers(StatusItem $item, User $owner): array
    {
        if ((int) $item->user_id !== (int) $owner->id) {
            abort(403, 'Only the owner can see status viewers.');
        }

        return $item->views()
            ->with('viewer')
            ->orderByDesc('viewed_at')
            ->get()
            ->map(function (StatusView $view) {
                $viewer = $view->viewer;

                return [
                    'userId' => $view->viewer_user_id,
                    'displayName' => $viewer?->publicDisplayName() ?? 'Gocha user',
                    'avatarUrl' => $viewer?->avatarUrl(),
                    'viewedAt' => $view->viewed_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    public function update(StatusItem $item, User $actor, array $input, ?UploadedFile $media = null): StatusItem
    {
        if ((int) $item->user_id !== (int) $actor->id) {
            abort(403, 'You can only edit your own status.');
        }

        if (! $item->isActive()) {
            abort(404, 'That status has expired.');
        }

        $type = (string) ($input['type'] ?? $item->type);
        if (! in_array($type, StatusType::all(), true)) {
            $type = $item->type;
        }

        if ($media) {
            $type = in_array((string) ($input['type'] ?? ''), [StatusType::IMAGE, StatusType::VIDEO], true)
                ? (string) $input['type']
                : $type;
            if (! in_array($type, [StatusType::IMAGE, StatusType::VIDEO], true)) {
                $type = StatusType::IMAGE;
            }
        }

        if ($type === StatusType::TEXT) {
            $text = array_key_exists('text', $input)
                ? trim((string) $input['text'])
                : trim((string) $item->body);
            if ($text === '') {
                throw ValidationException::withMessages([
                    'text' => ['Write something first.'],
                ]);
            }
            $color = isset($input['backgroundColor']) && in_array($input['backgroundColor'], StatusType::backgrounds(), true)
                ? (string) $input['backgroundColor']
                : (string) $item->background_color;
            if ($item->media_path) {
                $item->deleteMedia();
            }
            $item->forceFill([
                'type' => StatusType::TEXT,
                'body' => $text,
                'media_path' => null,
                'background_color' => $color ?: StatusType::backgrounds()[0],
                'duration_ms' => StatusType::TEXT_DURATION_MS,
            ])->save();

            return $item->fresh() ?? $item;
        }

        if ($media) {
            $item->deleteMedia();
            $path = $media->store('statuses/'.$actor->id, 'public');
            $duration = StatusType::defaultDuration($type);
            if ($type === StatusType::VIDEO && isset($input['durationMs'])) {
                $duration = max(3000, min(StatusType::VIDEO_MAX_MS, (int) $input['durationMs']));
            }
            $item->forceFill([
                'type' => $type,
                'media_path' => $path,
                'duration_ms' => $duration,
            ]);
        } elseif (! $item->media_path) {
            throw ValidationException::withMessages([
                'media' => ['Choose a photo or video.'],
            ]);
        } else {
            $item->type = $type;
        }

        if (array_key_exists('text', $input)) {
            $caption = trim((string) $input['text']);
            $item->body = $caption !== '' ? $caption : null;
        }

        $item->save();

        return $item->fresh() ?? $item;
    }

    public function delete(StatusItem $item, User $actor): void
    {
        if ((int) $item->user_id !== (int) $actor->id) {
            abort(403, 'You can only delete your own status.');
        }

        $item->deleteMedia();
        $item->delete();
    }

    public function pruneExpired(): int
    {
        $expired = StatusItem::query()->where('expires_at', '<=', now())->get();
        foreach ($expired as $item) {
            $item->deleteMedia();
            $item->delete();
        }

        return $expired->count();
    }

    /**
     * @param  Collection<int, StatusItem>  $items
     * @return array<string, mixed>
     */
    private function authorPayload(User $author, Collection $items, User $viewer): array
    {
        $unseen = $items->filter(fn (StatusItem $item) => ! $item->isViewedBy($viewer))->count();
        $latest = $items->last();

        return [
            'userId' => $author->id,
            'displayName' => $author->chatDisplayName(),
            'avatarUrl' => $author->avatarUrl(),
            'itemCount' => $items->count(),
            'unseenCount' => $unseen,
            'latestAt' => $latest?->created_at?->toIso8601String(),
            'items' => $items
                ->map(fn (StatusItem $item) => $item->toViewerPayload($viewer, (int) $author->id === (int) $viewer->id))
                ->values()
                ->all(),
        ];
    }

    private function assertRoom(User $user): void
    {
        $count = StatusItem::query()->active()->where('user_id', $user->id)->count();
        if ($count >= StatusType::MAX_ACTIVE_PER_USER) {
            throw ValidationException::withMessages([
                'status' => ['You already have '.StatusType::MAX_ACTIVE_PER_USER.' active status updates.'],
            ]);
        }
    }
}
