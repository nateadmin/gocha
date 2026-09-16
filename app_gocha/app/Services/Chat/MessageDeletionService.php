<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageHide;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MessageDeletionService
{
    public function delete(Conversation $conversation, Message $message, User $actor, string $scope): void
    {
        if ((int) $message->conversation_id !== (int) $conversation->id) {
            throw new InvalidArgumentException('Message does not belong to this conversation.');
        }

        if ($message->isDeletedForEveryone()) {
            return;
        }

        if ($scope === 'everyone') {
            if ((int) $message->sender_user_id !== (int) $actor->id) {
                throw new AuthorizationException('Only the sender can delete a message for everyone.');
            }

            DB::transaction(function () use ($conversation, $message) {
                $message->forceFill(['deleted_at' => now()])->save();
                $this->refreshConversationLastMessage($conversation);
            });

            return;
        }

        if ($scope !== 'me') {
            throw new InvalidArgumentException('Delete scope must be me or everyone.');
        }

        MessageHide::query()->firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $actor->id,
        ]);
    }

    private function refreshConversationLastMessage(Conversation $conversation): void
    {
        $latest = Message::query()
            ->where('conversation_id', $conversation->id)
            ->whereNull('deleted_at')
            ->orderByDesc('id')
            ->first();

        if (! $latest) {
            $conversation->forceFill([
                'last_message_body' => null,
                'last_message_at' => null,
                'last_message_sender_user_id' => null,
            ])->save();

            return;
        }

        $conversation->forceFill([
            'last_message_body' => $latest->body,
            'last_message_at' => $latest->created_at,
            'last_message_sender_user_id' => $latest->sender_user_id,
        ])->save();
    }
}
