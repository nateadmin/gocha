<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OtpResendCooldown
{
    public function key(string $channel, string $identifier): string
    {
        return 'gocha:otp:cooldown:'.hash('sha256', Str::lower(trim($channel)).':'.Str::lower(trim($identifier)));
    }

    public function isActive(string $channel, string $identifier): bool
    {
        return $this->remainingSeconds($channel, $identifier) > 0;
    }

    public function remainingSeconds(string $channel, string $identifier): int
    {
        $expiresAt = Cache::get($this->key($channel, $identifier));
        if (! is_numeric($expiresAt)) {
            return 0;
        }

        return max(0, (int) $expiresAt - time());
    }

    public function markSent(string $channel, string $identifier, ?int $seconds = null): void
    {
        $seconds ??= (int) config('gocha.auth.otp_resend_cooldown_seconds', 60);
        $expiresAt = time() + $seconds;
        Cache::put($this->key($channel, $identifier), $expiresAt, $seconds);
    }
}
