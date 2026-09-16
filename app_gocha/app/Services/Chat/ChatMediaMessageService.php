<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Support\MessageType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ChatMediaMessageService
{
    public function createImage(
        Conversation $conversation,
        User $sender,
        UploadedFile $image,
        ?string $caption = null,
    ): Message {
        $path = $image->store('conversation-media/'.$sender->id, 'public');
        $caption = $caption !== null ? trim($caption) : '';
        $preview = $caption !== '' ? $caption : 'Photo';

        return DB::transaction(function () use ($conversation, $sender, $path, $image, $caption, $preview) {
            $message = Message::query()->create([
                'conversation_id' => $conversation->id,
                'sender_user_id' => $sender->id,
                'type' => MessageType::IMAGE,
                'body' => $caption,
                'metadata' => [
                    'mediaPath' => $path,
                    'fileName' => $image->getClientOriginalName(),
                    'mimeType' => $image->getMimeType() ?: $image->getClientMimeType(),
                ],
            ]);

            $conversation->forceFill([
                'last_message_body' => $preview,
                'last_message_at' => $message->created_at,
                'last_message_sender_user_id' => $sender->id,
            ])->save();

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $sender->id)
                ->increment('unread_count');

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $sender->id)
                ->update([
                    'last_read_at' => $message->created_at,
                    'unread_count' => 0,
                ]);

            return $message->fresh(['sender']);
        });
    }
}
