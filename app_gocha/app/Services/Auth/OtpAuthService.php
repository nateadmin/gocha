<?php

namespace App\Services\Auth;

use App\Exceptions\OtpVerificationException;
use App\Models\LoginOtp;
use App\Models\User;
use App\Services\Mail\ResendMailer;
use App\Services\Profile\CharacterAvatarService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtpAuthService
{
    public function __construct(
        private readonly ResendMailer $mailer,
        private readonly CharacterAvatarService $avatars,
    ) {}

    public function requestCode(string $email): array
    {
        $email = Str::lower(trim($email));
        $userExists = User::query()->where('email', $email)->exists();
        $closed = (bool) config('gocha.auth.closed_membership', false);

        if ($closed && ! $userExists) {
            return $this->cooldownPayload($email);
        }

        $cooldownKey = $this->cooldownKey($email);
        if (Cache::has($cooldownKey)) {
            return $this->cooldownPayload($email);
        }

        $code = $this->generateCode();
        LoginOtp::query()->where('email', $email)->delete();

        LoginOtp::query()->create([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes((int) config('gocha.auth.otp_ttl_minutes', 10)),
        ]);

        Cache::put($cooldownKey, true, now()->addSeconds((int) config('gocha.auth.otp_resend_cooldown_seconds', 60)));

        $this->mailer->sendLoginCode($email, $code);

        return $this->cooldownPayload($email);
    }

    public function verifyCode(string $email, string $code): User
    {
        $email = Str::lower(trim($email));
        $otp = LoginOtp::query()->where('email', $email)->latest()->first();

        if (! $otp || $otp->isConsumed() || $otp->isExpired()) {
            throw new OtpVerificationException('OTP_EXPIRED', 'This code has expired. Request a new one.');
        }

        if ($otp->attempts >= (int) config('gocha.auth.otp_max_attempts', 5)) {
            $otp->delete();
            throw new OtpVerificationException('OTP_TOO_MANY_ATTEMPTS', 'Too many attempts. Request a new code.');
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');
            throw new OtpVerificationException('OTP_INVALID', 'That code is incorrect. Try again.');
        }

        $otp->forceFill(['consumed_at' => now()])->save();
        LoginOtp::query()->where('email', $email)->where('id', '!=', $otp->id)->delete();

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => Str::before($email, '@'),
                'password' => Str::password(32),
            ],
        );

        if (! $user->avatar_path) {
            $this->avatars->assignDefault($user);
        }

        return $user->fresh();
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function cooldownKey(string $email): string
    {
        return 'gocha:otp:cooldown:'.hash('sha256', $email);
    }

    private function cooldownPayload(string $email): array
    {
        $cooldownKey = $this->cooldownKey($email);
        $retryAfter = 0;
        if (Cache::has($cooldownKey)) {
            $retryAfter = (int) config('gocha.auth.otp_resend_cooldown_seconds', 60);
        }

        return [
            'message' => config('gocha.auth.otp_request_message'),
            'resendAvailableInSeconds' => $retryAfter,
        ];
    }
}
