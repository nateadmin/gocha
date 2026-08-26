<?php

namespace App\Services\Auth;

use App\Exceptions\OtpRequestException;
use App\Exceptions\OtpVerificationException;
use App\Models\LoginOtp;
use App\Models\User;
use App\Services\Mail\ResendMailer;
use App\Services\Profile\CharacterAvatarService;
use App\Support\AccountChannel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtpAuthService
{
    public function __construct(
        private readonly ResendMailer $mailer,
        private readonly CharacterAvatarService $avatars,
        private readonly AccountIdentifierService $identifiers,
    ) {}

    public function requestCode(string $channel, string $identifier, string $mode = 'signin'): array
    {
        $channel = Str::lower(trim($channel));
        $identifier = $this->identifiers->normalize($channel, $identifier);

        if ($channel === AccountChannel::PHONE) {
            throw new OtpRequestException(
                'SMS_NOT_CONFIGURED',
                'Phone sign-in is coming soon. Use email for now.',
            );
        }

        $userExists = $this->findUserByChannel($channel, $identifier) !== null;
        $closed = (bool) config('gocha.auth.closed_membership', false);

        if ($mode === 'signin') {
            if (! $userExists) {
                throw new OtpRequestException(
                    $channel === AccountChannel::EMAIL ? 'EMAIL_NOT_FOUND' : 'PHONE_NOT_FOUND',
                    $channel === AccountChannel::EMAIL
                        ? 'No Gocha account exists for this email. Sign up or check the address.'
                        : 'No Gocha account exists for this phone number. Sign up or check the number.',
                );
            }
        } elseif ($mode === 'signup') {
            if ($userExists) {
                throw new OtpRequestException(
                    $channel === AccountChannel::EMAIL ? 'EMAIL_ALREADY_REGISTERED' : 'PHONE_ALREADY_REGISTERED',
                    $channel === AccountChannel::EMAIL
                        ? 'An account already exists for this email. Sign in instead.'
                        : 'An account already exists for this phone number. Sign in instead.',
                );
            }
            if ($closed) {
                throw new OtpRequestException(
                    'SIGNUP_CLOSED',
                    'Sign-up is not open for new accounts right now.',
                );
            }
        }

        $cooldownKey = $this->cooldownKey($channel, $identifier);
        if (Cache::has($cooldownKey)) {
            return $this->cooldownPayload($channel, $identifier, $mode);
        }

        $code = $this->generateCode();
        LoginOtp::query()
            ->where('channel', $channel)
            ->where('identifier', $identifier)
            ->delete();

        LoginOtp::query()->create([
            'channel' => $channel,
            'identifier' => $identifier,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes((int) config('gocha.auth.otp_ttl_minutes', 10)),
        ]);

        Cache::put(
            $cooldownKey,
            true,
            now()->addSeconds((int) config('gocha.auth.otp_resend_cooldown_seconds', 60)),
        );

        if ($channel === AccountChannel::EMAIL) {
            $this->mailer->sendLoginCode($identifier, $code);
        }

        return $this->cooldownPayload($channel, $identifier, $mode);
    }

    public function verifyCode(string $channel, string $identifier, string $code, string $mode = 'signin'): User
    {
        $channel = Str::lower(trim($channel));
        $identifier = $this->identifiers->normalize($channel, $identifier);

        if ($channel === AccountChannel::PHONE) {
            throw new OtpVerificationException(
                'SMS_NOT_CONFIGURED',
                'Phone sign-in is coming soon. Use email for now.',
            );
        }

        $otp = LoginOtp::query()
            ->where('channel', $channel)
            ->where('identifier', $identifier)
            ->latest()
            ->first();

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
        LoginOtp::query()
            ->where('channel', $channel)
            ->where('identifier', $identifier)
            ->where('id', '!=', $otp->id)
            ->delete();

        if ($mode === 'signup') {
            if ($this->findUserByChannel($channel, $identifier)) {
                throw new OtpVerificationException(
                    $channel === AccountChannel::EMAIL ? 'EMAIL_ALREADY_REGISTERED' : 'PHONE_ALREADY_REGISTERED',
                    $channel === AccountChannel::EMAIL
                        ? 'An account already exists for this email. Sign in instead.'
                        : 'An account already exists for this phone number. Sign in instead.',
                );
            }

            $user = $this->createUserForChannel($channel, $identifier);
        } else {
            $user = $this->findUserByChannel($channel, $identifier);
            if (! $user) {
                throw new OtpVerificationException(
                    $channel === AccountChannel::EMAIL ? 'EMAIL_NOT_FOUND' : 'PHONE_NOT_FOUND',
                    $channel === AccountChannel::EMAIL
                        ? 'No Gocha account exists for this email. Sign up or check the address.'
                        : 'No Gocha account exists for this phone number. Sign up or check the number.',
                );
            }
        }

        if ($channel === AccountChannel::EMAIL) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        if (! $user->avatar_path) {
            $this->avatars->assignDefault($user);
        }

        return $user->fresh();
    }

    private function findUserByChannel(string $channel, string $identifier): ?User
    {
        if ($channel === AccountChannel::EMAIL) {
            return User::query()->where('email', $identifier)->first();
        }

        return User::query()->where('phone', $identifier)->first();
    }

    private function createUserForChannel(string $channel, string $identifier): User
    {
        $attributes = [
            'password' => Str::password(32),
            'primary_login_channel' => $channel,
        ];

        if ($channel === AccountChannel::EMAIL) {
            $attributes['email'] = $identifier;
            $attributes['name'] = Str::before($identifier, '@');
            $attributes['email_verified_at'] = now();
        } else {
            $attributes['phone'] = $identifier;
            $attributes['name'] = 'Gocha user';
            $attributes['phone_verified_at'] = now();
        }

        return User::query()->create($attributes);
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function cooldownKey(string $channel, string $identifier): string
    {
        return 'gocha:otp:cooldown:'.hash('sha256', $channel.':'.$identifier);
    }

    private function cooldownPayload(string $channel, string $identifier, string $mode): array
    {
        $cooldownKey = $this->cooldownKey($channel, $identifier);
        $retryAfter = Cache::has($cooldownKey)
            ? (int) config('gocha.auth.otp_resend_cooldown_seconds', 60)
            : 0;

        $message = $mode === 'signup'
            ? config('gocha.auth.otp_signup_request_message')
            : config('gocha.auth.otp_signin_request_message');

        return [
            'message' => $message,
            'resendAvailableInSeconds' => $retryAfter,
        ];
    }
}
