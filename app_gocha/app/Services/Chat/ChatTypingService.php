<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ChatTypingService
{
    private const TTL_SECONDS = 6;

    public function setTyping(Conversation $conversation, User $user, bool $typing): void
    {
        $key = $this->cacheKey($conversation->id, $user->id);

        if ($typing) {
            Cache::put($key, now()->timestamp, now()->addSeconds(self::TTL_SECONDS));

            return;
        }

        Cache::forget($key);
    }

    /**
     * @return array<int, array{userId: int, name: string}>
     */
    public function typingUsers(Conversation $conversation, User $viewer): array
    {
        $conversation->loadMissing('participants');

        $typing = [];
        foreach ($conversation->participants as $participant) {
            if ((int) $participant->id === (int) $viewer->id) {
                continue;
            }

            if (! Cache::has($this->cacheKey($conversation->id, $participant->id))) {
                continue;
            }

            $typing[] = [
                'userId' => (int) $participant->id,
                'name' => $participant->chatDisplayName(),
            ];
        }

        return $typing;
    }

    private function cacheKey(int $conversationId, int $userId): string
    {
        return 'chat:typing:'.$conversationId.':'.$userId;
    }
}
