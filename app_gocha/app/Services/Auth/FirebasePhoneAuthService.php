<?php

namespace App\Services\Auth;

use App\Exceptions\OtpRequestException;
use App\Exceptions\OtpVerificationException;
use Illuminate\Support\Facades\Http;

class FirebasePhoneAuthService
{
    public function isConfigured(): bool
    {
        return filled(config('gocha.firebase.web_api_key'))
            && filled(config('gocha.firebase.project_id'));
    }

    /**
     * @return array{apiKey: string, authDomain: string|null, projectId: string, appId: string|null}|null
     */
    public function publicConfig(): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        return [
            'apiKey' => (string) config('gocha.firebase.web_api_key'),
            'authDomain' => config('gocha.firebase.auth_domain'),
            'projectId' => (string) config('gocha.firebase.project_id'),
            'appId' => config('gocha.firebase.app_id'),
        ];
    }

    public function sendVerificationCode(string $phone, string $recaptchaToken): string
    {
        if (! $this->isConfigured()) {
            throw new OtpRequestException(
                'SMS_NOT_CONFIGURED',
                'Phone sign-in is not configured yet.',
            );
        }

        $token = trim($recaptchaToken);
        if ($token === '') {
            throw new OtpRequestException(
                'RECAPTCHA_REQUIRED',
                'Confirm you are not a robot, then request a new code.',
            );
        }

        $response = $this->identityHttp()->post($this->endpoint('accounts:sendVerificationCode'), [
            'phoneNumber' => $phone,
            'recaptchaToken' => $token,
        ]);

        $sessionInfo = $response->json('sessionInfo');
        if ($response->successful() && is_string($sessionInfo) && $sessionInfo !== '') {
            return $sessionInfo;
        }

        throw new OtpRequestException(
            $this->mapErrorCode($response->json('error.message'), 'SMS_SEND_FAILED'),
            $this->mapErrorMessage($response->json('error.message'), 'Could not send an SMS code. Try again.'),
        );
    }

    public function verifyCode(string $sessionInfo, string $code, string $expectedPhone): string
    {
        if (! $this->isConfigured()) {
            throw new OtpVerificationException(
                'SMS_NOT_CONFIGURED',
                'Phone sign-in is not configured yet.',
            );
        }

        $response = $this->identityHttp()->post($this->endpoint('accounts:signInWithPhoneNumber'), [
            'sessionInfo' => $sessionInfo,
            'code' => $code,
        ]);

        $phone = $response->json('phoneNumber');
        if ($response->successful() && is_string($phone) && $phone !== '') {
            if ($phone !== $expectedPhone) {
                throw new OtpVerificationException(
                    'OTP_INVALID',
                    'That code is incorrect. Try again.',
                );
            }

            return $phone;
        }

        throw new OtpVerificationException(
            $this->mapErrorCode($response->json('error.message'), 'OTP_INVALID'),
            $this->mapErrorMessage($response->json('error.message'), 'That code is incorrect. Try again.'),
        );
    }

    private function identityHttp(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::timeout((int) config('gocha.firebase.timeout', 12))
            ->connectTimeout((int) config('gocha.firebase.connect_timeout', 5))
            ->withOptions(['force_ip_resolve' => 'v4'])
            ->acceptJson()
            ->asJson();
    }

    private function endpoint(string $method): string
    {
        $key = urlencode((string) config('gocha.firebase.web_api_key'));

        return 'https://identitytoolkit.googleapis.com/v1/'.$method.'?key='.$key;
    }

    private function mapErrorCode(mixed $firebaseMessage, string $fallback): string
    {
        $message = is_string($firebaseMessage) ? $firebaseMessage : '';

        return match (true) {
            str_contains($message, 'INVALID_PHONE_NUMBER') => 'INVALID_PHONE',
            str_contains($message, 'QUOTA_EXCEEDED') => 'SMS_QUOTA',
            str_contains($message, 'MISSING_RECAPTCHA') => 'RECAPTCHA_REQUIRED',
            str_contains($message, 'INVALID_RECAPTCHA') => 'RECAPTCHA_REQUIRED',
            str_contains($message, 'SESSION_EXPIRED') => 'OTP_EXPIRED',
            str_contains($message, 'INVALID_CODE') => 'OTP_INVALID',
            default => $fallback,
        };
    }

    private function mapErrorMessage(mixed $firebaseMessage, string $fallback): string
    {
        $message = is_string($firebaseMessage) ? $firebaseMessage : '';

        return match (true) {
            str_contains($message, 'INVALID_PHONE_NUMBER') => 'Enter a valid phone number with country code.',
            str_contains($message, 'QUOTA_EXCEEDED') => 'Too many SMS codes today. Try again tomorrow.',
            str_contains($message, 'MISSING_RECAPTCHA') => 'Confirm you are not a robot, then request a new code.',
            str_contains($message, 'INVALID_RECAPTCHA') => 'Confirm you are not a robot, then request a new code.',
            str_contains($message, 'SESSION_EXPIRED') => 'This code has expired. Request a new one.',
            str_contains($message, 'INVALID_CODE') => 'That code is incorrect. Try again.',
            default => $fallback,
        };
    }
}
