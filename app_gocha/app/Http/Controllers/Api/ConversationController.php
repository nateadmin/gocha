<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Services\Locale\MessageTranslationService;
use App\Services\Locale\TranslationBudget;
use App\Services\Status\StatusService;
use App\Support\ConversationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ConversationController extends Controller
{
    public function __construct(
        private readonly MessageTranslationService $translations,
        private readonly StatusService $statuses,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->markIncomingMessagesDelivered($user);

        $conversations = Conversation::query()
            ->whereHas('participantRows', fn ($query) => $query->where('user_id', $user->id))
            ->with(['participants', 'participantRows'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();

        $otherIds = $conversations
            ->map(fn (Conversation $conversation) => $conversation->otherParticipant($user)?->id)
            ->filter()
            ->values();
        $statusFlags = $this->statuses->summariesForUsers($user, $otherIds);

        $conversations = $conversations
            ->map(fn (Conversation $conversation) => $this->toConversationPayload($conversation, $user, $statusFlags))
            ->values();

        return response()->json(['conversations' => $conversations]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'participantUserId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user();
        $otherUserId = (int) $validated['participantUserId'];

        if ($otherUserId === $user->id) {
            return response()->json([
                'code' => 'INVALID_PARTICIPANT',
                'message' => 'You cannot start a conversation with yourself.',
            ], 422);
        }

        $existing = $this->findDirectConversation($user->id, $otherUserId);
        if ($existing) {
            $existing->load(['participants', 'participantRows']);

            return response()->json([
                'conversation' => $this->toConversationPayload($existing, $user, $this->statusFlagsFor($user, $existing)),
            ]);
        }

        $otherUser = User::query()->findOrFail($otherUserId);

        $conversation = DB::transaction(function () use ($user, $otherUser) {
            $conversation = Conversation::query()->create([
                'type' => ConversationType::DM,
            ]);

            ConversationParticipant::query()->create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
            ]);

            ConversationParticipant::query()->create([
                'conversation_id' => $conversation->id,
                'user_id' => $otherUser->id,
            ]);

            return $conversation;
        });

        $conversation->load(['participants', 'participantRows']);

        return response()->json([
            'conversation' => $this->toConversationPayload($conversation, $user, $this->statusFlagsFor($user, $conversation)),
        ], 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeParticipant($user, $conversation);
        $this->markIncomingMessagesDelivered($user, $conversation);

        $budget = new TranslationBudget;
        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->limit(200)
            ->get()
            ->map(fn (Message $message) => $this->toMessagePayload($message, $user, $budget))
            ->values();

        return response()->json(['messages' => $messages]);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeParticipant($user, $conversation);

        $validated = $request->validate([
            'type' => ['sometimes', 'string', Rule::in(['text', 'emoji'])],
            'text' => ['required', 'string', 'max:4000'],
        ]);

        $type = $validated['type'] ?? 'text';
        $body = trim($validated['text']);

        if ($body === '') {
            return response()->json([
                'code' => 'EMPTY_MESSAGE',
                'message' => 'Message text is required.',
            ], 422);
        }

        $message = DB::transaction(function () use ($conversation, $user, $type, $body) {
            $message = Message::query()->create([
                'conversation_id' => $conversation->id,
                'sender_user_id' => $user->id,
                'type' => $type,
                'body' => $body,
            ]);

            $conversation->forceFill([
                'last_message_body' => $body,
                'last_message_at' => $message->created_at,
                'last_message_sender_user_id' => $user->id,
            ])->save();

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $user->id)
                ->increment('unread_count');

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $user->id)
                ->update([
                    'last_read_at' => $message->created_at,
                    'unread_count' => 0,
                ]);

            return $message;
        });

        return response()->json([
            'message' => $this->toMessagePayload($message, $user),
        ], 201);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeParticipant($user, $conversation);

        $now = now();

        ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->update([
                'last_read_at' => $now,
                'unread_count' => 0,
            ]);

        Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => $now]);

        Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_user_id', '!=', $user->id)
            ->whereNull('delivered_at')
            ->update(['delivered_at' => $now]);

        return response()->json(['ok' => true]);
    }

    private function authorizeParticipant(User $user, Conversation $conversation): void
    {
        $isParticipant = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->exists();

        if (! $isParticipant) {
            abort(403, 'You are not a participant in this conversation.');
        }
    }

    private function findDirectConversation(int $userId, int $otherUserId): ?Conversation
    {
        return Conversation::query()
            ->where('type', ConversationType::DM)
            ->whereHas('participantRows', fn ($query) => $query->where('user_id', $userId))
            ->whereHas('participantRows', fn ($query) => $query->where('user_id', $otherUserId))
            ->first();
    }

    /**
     * @return array<int, array{hasStatus: bool, unseen: bool}>
     */
    private function statusFlagsFor(User $viewer, Conversation $conversation): array
    {
        $otherId = $conversation->otherParticipant($viewer)?->id;

        return $this->statuses->summariesForUsers($viewer, $otherId ? [$otherId] : []);
    }

    /**
     * @param  array<int, array{hasStatus: bool, unseen: bool}>  $statusFlags
     */
    private function toConversationPayload(Conversation $conversation, User $viewer, array $statusFlags = []): array
    {
        $other = $conversation->otherParticipant($viewer);
        $participantRow = $conversation->participantRows
            ->firstWhere('user_id', $viewer->id);

        $displayName = $other?->chatDisplayName() ?? 'Conversation';
        $preview = $conversation->last_message_body ?? 'No messages yet';
        if ($preview !== 'No messages yet' && $conversation->last_message_sender_user_id !== $viewer->id) {
            $lastIncoming = $conversation->relationLoaded('messages')
                ? $conversation->messages->where('sender_user_id', '!=', $viewer->id)->sortByDesc('id')->first()
                : $conversation->messages()
                    ->where('sender_user_id', '!=', $viewer->id)
                    ->orderByDesc('id')
                    ->first();
            if ($lastIncoming) {
                $preview = $this->translations->decorateCached($lastIncoming, $viewer)['text'];
            }
        }
        if (
            $preview !== 'No messages yet' &&
            $conversation->last_message_sender_user_id === $viewer->id
        ) {
            $preview = 'You: '.$preview;
        }
        $lastActivityAt = ($conversation->last_message_at ?? $conversation->updated_at)?->toIso8601String();

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'name' => $displayName,
            'avatarUrl' => $other?->avatarUrl(),
            'avatarLabel' => $this->avatarLabel($displayName),
            'avatarColor' => $this->avatarColor($other?->id ?? $conversation->id),
            'otherUserId' => $other?->id,
            'preview' => $preview,
            'lastActivityAt' => $lastActivityAt,
            'unreadCount' => (int) ($participantRow?->unread_count ?? 0),
            'isBusiness' => $other?->isBusinessProfileMode() ?? false,
            'hasStatus' => (bool) ($statusFlags[$other?->id ?? 0]['hasStatus'] ?? false),
            'statusUnseen' => (bool) ($statusFlags[$other?->id ?? 0]['unseen'] ?? false),
        ];
    }

    /** @return array<string, mixed> */
    private function toMessagePayload(Message $message, User $viewer, ?TranslationBudget $budget = null): array
    {
        $senderUserId = (int) $message->sender_user_id;
        $translated = $this->translations->decorate($message, $viewer, $budget);

        return [
            'id' => (string) $message->id,
            'type' => $message->type,
            'text' => $translated['text'],
            'originalText' => $translated['originalText'],
            'isTranslated' => $translated['isTranslated'],
            'sourceLanguage' => $translated['sourceLanguage'],
            'sentAt' => $message->created_at?->toIso8601String(),
            'senderUserId' => $senderUserId,
            'isOutgoing' => $senderUserId === (int) $viewer->id,
            'status' => $this->receiptStatus($message),
        ];
    }

    private function receiptStatus(Message $message): string
    {
        if ($message->read_at) {
            return 'read';
        }

        if ($message->delivered_at) {
            return 'delivered';
        }

        return 'sent';
    }

    private function markIncomingMessagesDelivered(User $user, ?Conversation $conversation = null): void
    {
        $query = Message::query()
            ->where('sender_user_id', '!=', $user->id)
            ->whereNull('delivered_at');

        if ($conversation) {
            $query->where('conversation_id', $conversation->id);
        } else {
            $conversationIds = ConversationParticipant::query()
                ->where('user_id', $user->id)
                ->pluck('conversation_id');

            if ($conversationIds->isEmpty()) {
                return;
            }

            $query->whereIn('conversation_id', $conversationIds);
        }

        $query->update(['delivered_at' => now()]);
    }

    private function avatarLabel(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $initials .= strtoupper(substr($part, 0, 1));
        }

        return $initials !== '' ? $initials : 'G';
    }

    private function avatarColor(int $seed): string
    {
        $colors = ['#1B00D8', '#00669c', '#00734a', '#5b42f3', '#c45c26', '#3d9a8b', '#5b8def', '#e07a5f'];

        return $colors[abs($seed) % count($colors)];
    }
}
