<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Support\ConversationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class GlobalSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $user = $request->user();
        $needle = $validated['q'];
        $needleLower = mb_strtolower($needle);

        $contacts = $this->searchContacts($user, $needle, $needleLower);
        $contactUserIds = $contacts->pluck('userId')->all();

        $messages = $this->searchMessages($user, $needle);
        $people = $this->searchDiscoverablePeople($user, $needle, $contactUserIds);

        return response()->json([
            'contacts' => $contacts->values(),
            'messages' => $messages->values(),
            'people' => $people->values(),
        ]);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function searchContacts(User $user, string $needle, string $needleLower): Collection
    {
        return Conversation::query()
            ->where('type', ConversationType::DM)
            ->whereHas('participantRows', fn ($query) => $query->where('user_id', $user->id))
            ->with(['participants', 'participantRows'])
            ->get()
            ->map(function (Conversation $conversation) use ($user) {
                $other = $conversation->otherParticipant($user);
                if (! $other) {
                    return null;
                }

                return ['conversation' => $conversation, 'other' => $other];
            })
            ->filter()
            ->filter(function (array $row) use ($needle, $needleLower) {
                $other = $row['other'];

                if (str_contains(mb_strtolower($other->chatDisplayName()), $needleLower)) {
                    return true;
                }

                if ($other->username && str_contains(mb_strtolower($other->username), $needleLower)) {
                    return true;
                }

                if ($other->email && str_contains(mb_strtolower($other->email), $needleLower)) {
                    return true;
                }

                return $other->phone && str_contains($other->phone, $needle);
            })
            ->take(20)
            ->map(fn (array $row) => [
                'conversationId' => $row['conversation']->id,
                'userId' => $row['other']->id,
                'displayName' => $row['other']->chatDisplayName(),
                'username' => $row['other']->username,
                'avatarUrl' => $row['other']->avatarUrl(),
            ])
            ->values();
    }

    /** @return Collection<int, array<string, mixed>> */
    private function searchMessages(User $user, string $needle): Collection
    {
        return Message::query()
            ->whereIn('type', ['text', 'emoji'])
            ->where('body', 'like', '%'.$needle.'%')
            ->whereHas('conversation.participantRows', fn ($query) => $query->where('user_id', $user->id))
            ->with(['conversation.participants', 'conversation.participantRows'])
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->map(function (Message $message) use ($user) {
                $conversation = $message->conversation;
                $other = $conversation?->otherParticipant($user);
                $conversationName = $other?->chatDisplayName() ?? 'Conversation';

                return [
                    'id' => (string) $message->id,
                    'conversationId' => $conversation?->id,
                    'conversationName' => $conversationName,
                    'text' => $message->body,
                    'sentAt' => $message->created_at?->toIso8601String(),
                    'isOutgoing' => $message->sender_user_id === $user->id,
                ];
            })
            ->values();
    }

    /**
     * @param  list<int>  $excludeUserIds
     * @return Collection<int, array<string, mixed>>
     */
    private function searchDiscoverablePeople(User $user, string $needle, array $excludeUserIds): Collection
    {
        return User::query()
            ->where('id', '!=', $user->id)
            ->where('discoverable', true)
            ->when($excludeUserIds !== [], fn ($query) => $query->whereNotIn('id', $excludeUserIds))
            ->where(function ($query) use ($needle) {
                $query->where('display_name', 'like', '%'.$needle.'%')
                    ->orWhere('name', 'like', '%'.$needle.'%')
                    ->orWhere('username', 'like', '%'.$needle.'%')
                    ->orWhere('email', 'like', '%'.$needle.'%')
                    ->orWhere('phone', 'like', '%'.$needle.'%');
            })
            ->orderBy('display_name')
            ->limit(20)
            ->get()
            ->map(fn (User $match) => $match->toPublicProfilePayload())
            ->values();
    }
}
