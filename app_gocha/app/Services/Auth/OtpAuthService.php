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
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtpAuthService
{
    public function __construct(
        private readonly ResendMailer $mailer,
        private readonly CharacterAvatarService $avatars,
        private readonly AccountIdentifierService $identifiers,
        private readonly OtpResendCooldown $cooldown,
        private readonly FirebasePhoneAuthService $firebasePhone,
    ) {}

    public function requestCode(
        string $channel,
        string $identifier,
        string $mode = 'signin',
        ?string $recaptchaToken = null,
        ?User $actor = null,
    ): array {
        $channel = Str::lower(trim($channel));
        $identifier = $this->identifiers->normalize($channel, $identifier);
        $mode = Str::lower(trim($mode));

        if ($channel === AccountChannel::PHONE && ! $this->firebasePhone->isConfigured()) {
            throw new OtpRequestException(
                'SMS_NOT_CONFIGURED',
                'Phone sign-in is coming soon. Use email for now.',
            );
        }

        if ($mode === 'link') {
            $this->assertCanLink($actor, $channel, $identifier);
        } else {
            $this->assertAuthModeAllowed($channel, $identifier, $mode);
        }

        if ($this->cooldown->isActive($channel, $identifier)) {
            return $this->cooldownPayload($channel, $identifier, $mode);
        }

        $providerSession = null;
        $code = $this->generateCode();

        if ($channel === AccountChannel::PHONE) {
            $this->assertSmsQuota($identifier);
            $providerSession = $this->firebasePhone->sendVerificationCode(
                $identifier,
                (string) $recaptchaToken,
            );
            $this->incrementSmsQuota($identifier);
        }

        LoginOtp::query()
            ->where('channel', $channel)
            ->where('identifier', $identifier)
            ->delete();

        LoginOtp::query()->create([
            'channel' => $channel,
            'identifier' => $identifier,
            'code_hash' => Hash::make($code),
            'provider_session' => $providerSession ? Crypt::encryptString($providerSession) : null,
            'attempts' => 0,
            'expires_at' => now()->addMinutes((int) config('gocha.auth.otp_ttl_minutes', 10)),
        ]);

        $this->cooldown->markSent($channel, $identifier);

        if ($channel === AccountChannel::EMAIL) {
            $this->mailer->sendLoginCode($identifier, $code);
        }

        return $this->cooldownPayload($channel, $identifier, $mode);
    }

    public function verifyCode(
        string $channel,
        string $identifier,
        string $code,
        string $mode = 'signin',
        ?User $actor = null,
    ): User {
        $channel = Str::lower(trim($channel));
        $identifier = $this->identifiers->normalize($channel, $identifier);
        $mode = Str::lower(trim($mode));

        if ($channel === AccountChannel::PHONE && ! $this->firebasePhone->isConfigured()) {
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

        try {
            if ($channel === AccountChannel::PHONE) {
                $sessionInfo = $otp->provider_session
                    ? Crypt::decryptString($otp->provider_session)
                    : '';
                $this->firebasePhone->verifyCode($sessionInfo, $code, $identifier);
            } elseif (! Hash::check($code, $otp->code_hash)) {
                throw new OtpVerificationException('OTP_INVALID', 'That code is incorrect. Try again.');
            }
        } catch (OtpVerificationException $e) {
            if ($e->errorCode === 'OTP_INVALID') {
                $otp->increment('attempts');
            }
            throw $e;
        }

        $otp->forceFill(['consumed_at' => now()])->save();
        LoginOtp::query()
            ->where('channel', $channel)
            ->where('identifier', $identifier)
            ->where('id', '!=', $otp->id)
            ->delete();

        if ($mode === 'link') {
            return $this->linkVerifiedIdentifier($actor, $channel, $identifier);
        }

        if ($mode === 'signup') {
            if ($this->findUserByChannel($channel, $identifier, verifiedOnly: false)) {
                throw new OtpVerificationException(
                    $channel === AccountChannel::EMAIL ? 'EMAIL_ALREADY_REGISTERED' : 'PHONE_ALREADY_REGISTERED',
                    $channel === AccountChannel::EMAIL
                        ? 'An account already exists for this email. Sign in instead.'
                        : 'An account already exists for this phone number. Sign in instead.',
                );
            }

            $user = $this->createUserForChannel($channel, $identifier);
        } else {
            $user = $this->findUserByChannel($channel, $identifier, verifiedOnly: true);
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

        if ($channel === AccountChannel::PHONE) {
            $user->forceFill(['phone_verified_at' => now()])->save();
        }

        if (! $user->avatar_path) {
            $this->avatars->assignDefault($user);
        }

        return $user->fresh();
    }

    private function assertAuthModeAllowed(string $channel, string $identifier, string $mode): void
    {
        $userExists = $this->findUserByChannel($channel, $identifier, verifiedOnly: false) !== null;
        $closed = (bool) config('gocha.auth.closed_membership', false);

        if ($mode === 'signin') {
            if ($this->findUserByChannel($channel, $identifier, verifiedOnly: true) === null) {
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
        } else {
            throw new OtpRequestException('VALIDATION_ERROR', 'Unsupported sign-in mode.');
        }
    }

    private function assertCanLink(?User $actor, string $channel, string $identifier): void
    {
        if (! $actor) {
            throw new OtpRequestException('UNAUTHENTICATED', 'Sign in required.');
        }

        $taken = User::query()
            ->where($channel === AccountChannel::EMAIL ? 'email' : 'phone', $identifier)
            ->where('id', '!=', $actor->id)
            ->exists();

        if ($taken) {
            throw new OtpRequestException(
                $channel === AccountChannel::EMAIL ? 'EMAIL_ALREADY_REGISTERED' : 'PHONE_ALREADY_REGISTERED',
                $channel === AccountChannel::EMAIL
                    ? 'That email is already linked to another account.'
                    : 'That phone number is already linked to another account.',
            );
        }
    }

    private function linkVerifiedIdentifier(?User $actor, string $channel, string $identifier): User
    {
        if (! $actor) {
            throw new OtpVerificationException('UNAUTHENTICATED', 'Sign in required.');
        }

        $taken = User::query()
            ->where($channel === AccountChannel::EMAIL ? 'email' : 'phone', $identifier)
            ->where('id', '!=', $actor->id)
            ->exists();

        if ($taken) {
            throw new OtpVerificationException(
                $channel === AccountChannel::EMAIL ? 'EMAIL_ALREADY_REGISTERED' : 'PHONE_ALREADY_REGISTERED',
                $channel === AccountChannel::EMAIL
                    ? 'That email is already linked to another account.'
                    : 'That phone number is already linked to another account.',
            );
        }

        if ($channel === AccountChannel::EMAIL) {
            $actor->forceFill([
                'email' => $identifier,
                'email_verified_at' => now(),
            ])->save();
        } else {
            $actor->forceFill([
                'phone' => $identifier,
                'phone_verified_at' => now(),
            ])->save();
        }

        if (! $actor->avatar_path) {
            $this->avatars->assignDefault($actor);
        }

        return $actor->fresh();
    }

    private function findUserByChannel(string $channel, string $identifier, bool $verifiedOnly = true): ?User
    {
        $query = User::query();

        if ($channel === AccountChannel::EMAIL) {
            $query->where('email', $identifier);
            if ($verifiedOnly) {
                $query->whereNotNull('email_verified_at');
            }

            return $query->first();
        }

        $query->where('phone', $identifier);
        if ($verifiedOnly) {
            $query->whereNotNull('phone_verified_at');
        }

        return $query->first();
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
            $attributes['email'] = null;
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

    private function assertSmsQuota(string $phone): void
    {
        $limit = (int) config('gocha.auth.sms_per_phone_per_day', 8);
        if (Cache::get($this->smsQuotaKey($phone), 0) >= $limit) {
            throw new OtpRequestException(
                'SMS_QUOTA',
                'Too many SMS codes today. Try again tomorrow.',
            );
        }
    }

    private function incrementSmsQuota(string $phone): void
    {
        $key = $this->smsQuotaKey($phone);
        if (! Cache::has($key)) {
            Cache::put($key, 0, now()->endOfDay());
        }
        Cache::increment($key);
    }

    private function smsQuotaKey(string $phone): string
    {
        return 'gocha:otp:sms:daily:'.hash('sha256', $phone);
    }

    private function cooldownPayload(string $channel, string $identifier, string $mode): array
    {
        $retryAfter = $this->cooldown->remainingSeconds($channel, $identifier);
        $dest = $channel === AccountChannel::PHONE ? 'phone' : 'email';

        if ($channel === AccountChannel::EMAIL) {
            $message = $mode === 'signup' || $mode === 'link'
                ? config('gocha.auth.otp_signup_request_message')
                : config('gocha.auth.otp_signin_request_message');
        } else {
            $message = $mode === 'signin'
                ? 'A sign-in code has been sent to your '.$dest.'.'
                : 'A verification code has been sent to your '.$dest.'.';
        }

        return [
            'message' => $message,
            'resendAvailableInSeconds' => $retryAfter,
        ];
    }
}
