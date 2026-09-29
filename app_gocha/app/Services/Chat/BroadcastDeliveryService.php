<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Support\ConversationType;
use App\Support\MessageType;
use Illuminate\Support\Facades\DB;

class BroadcastDeliveryService
{
    public function deliver(Conversation $broadcast, Message $source, User $sender): void
    {
        if (! $broadcast->isBroadcast()) {
            return;
        }

        $broadcast->loadMissing('participants');
        $preview = $this->previewFor($source);

        foreach ($broadcast->participants as $recipient) {
            if ((int) $recipient->id === (int) $sender->id) {
                continue;
            }

            $dm = $this->findOrCreateDirect($sender, $recipient);

            $copy = Message::query()->create([
                'conversation_id' => $dm->id,
                'sender_user_id' => $sender->id,
                'type' => $source->type,
                'body' => $source->body,
                'metadata' => $source->metadata,
            ]);

            $dm->forceFill([
                'last_message_body' => $preview,
                'last_message_at' => $copy->created_at,
                'last_message_sender_user_id' => $sender->id,
            ])->save();

            ConversationParticipant::query()
                ->where('conversation_id', $dm->id)
                ->where('user_id', $recipient->id)
                ->increment('unread_count');

            ConversationParticipant::query()
                ->where('conversation_id', $dm->id)
                ->where('user_id', $sender->id)
                ->update([
                    'last_read_at' => $copy->created_at,
                    'unread_count' => 0,
                ]);
        }
    }

    public function sendDirect(User $from, User $to, string $body): ?Message
    {
        if ((int) $from->id === (int) $to->id) {
            return null;
        }

        $text = trim($body);
        if ($text === '') {
            return null;
        }

        $dm = $this->findOrCreateDirect($from, $to);

        return $this->postText($dm, $from, $text, [(int) $to->id]);
    }

    /**
     * @param  list<int>  $notifyUserIds
     */
    public function postText(Conversation $conversation, User $sender, string $body, array $notifyUserIds): Message
    {
        $text = trim($body);
        $notify = collect($notifyUserIds)
            ->map(fn ($id) => (int) $id)
            ->reject(fn (int $id) => $id === (int) $sender->id)
            ->unique()
            ->values();

        $message = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $sender->id,
            'type' => MessageType::TEXT,
            'body' => $text,
        ]);

        $conversation->forceFill([
            'last_message_body' => $text,
            'last_message_at' => $message->created_at,
            'last_message_sender_user_id' => $sender->id,
        ])->save();

        if ($notify->isNotEmpty()) {
            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->whereIn('user_id', $notify->all())
                ->increment('unread_count');
        }

        ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $sender->id)
            ->update([
                'last_read_at' => $message->created_at,
                'unread_count' => 0,
            ]);

        return $message;
    }

    public function findOrCreateDirect(User $user, User $other): Conversation
    {
        $existing = Conversation::query()
            ->where('type', ConversationType::DM)
            ->whereHas('participantRows', fn ($query) => $query->where('user_id', $user->id))
            ->whereHas('participantRows', fn ($query) => $query->where('user_id', $other->id))
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($user, $other) {
            $conversation = Conversation::query()->create([
                'type' => ConversationType::DM,
            ]);

            ConversationParticipant::query()->create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
            ]);

            ConversationParticipant::query()->create([
                'conversation_id' => $conversation->id,
                'user_id' => $other->id,
            ]);

            return $conversation;
        });
    }

    private function previewFor(Message $message): string
    {
        $body = trim((string) $message->body);
        if ($body !== '') {
            return $body;
        }
        if ($message->type === MessageType::IMAGE) {
            return 'Photo';
        }

        return 'Message';
    }
}
