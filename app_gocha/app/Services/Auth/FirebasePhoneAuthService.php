<?php

namespace App\Services\Auth;

use App\Exceptions\OtpVerificationException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

    public function verifyIdToken(string $idToken, string $expectedPhone): string
    {
        if (! $this->isConfigured()) {
            throw new OtpVerificationException(
                'SMS_NOT_CONFIGURED',
                'Phone sign-in is not configured yet.',
            );
        }

        $token = trim($idToken);
        if ($token === '') {
            throw new OtpVerificationException(
                'OTP_INVALID',
                'That code is incorrect. Try again.',
            );
        }

        $response = $this->identityHttp()->post($this->endpoint('accounts:lookup'), [
            'idToken' => $token,
        ]);

        $phone = $response->json('users.0.phoneNumber');
        if ($response->successful() && is_string($phone) && $phone !== '') {
            if ($phone !== $expectedPhone) {
                throw new OtpVerificationException(
                    'OTP_INVALID',
                    'That code is incorrect. Try again.',
                );
            }

            return $phone;
        }

        $firebaseMessage = $response->json('error.message');
        if (is_string($firebaseMessage) && $firebaseMessage !== '') {
            Log::warning('firebase_phone_lookup_failed', [
                'error' => $firebaseMessage,
            ]);
        }

        throw new OtpVerificationException(
            $this->mapErrorCode($firebaseMessage, 'OTP_INVALID'),
            $this->mapErrorMessage($firebaseMessage, 'That code is incorrect. Try again.'),
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
            str_contains($message, 'INVALID_ID_TOKEN') => 'OTP_EXPIRED',
            str_contains($message, 'TOKEN_EXPIRED') => 'OTP_EXPIRED',
            default => $fallback,
        };
    }

    private function mapErrorMessage(mixed $firebaseMessage, string $fallback): string
    {
        $message = is_string($firebaseMessage) ? $firebaseMessage : '';

        return match (true) {
            str_contains($message, 'INVALID_ID_TOKEN') => 'This code has expired. Request a new one.',
            str_contains($message, 'TOKEN_EXPIRED') => 'This code has expired. Request a new one.',
            default => $fallback,
        };
    }
}
