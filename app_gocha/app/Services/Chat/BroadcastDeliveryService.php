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
