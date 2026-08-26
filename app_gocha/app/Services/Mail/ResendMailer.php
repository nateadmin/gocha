<?php

namespace App\Services\Mail;

use GuzzleHttp\Client;
use Illuminate\Support\Str;
use RuntimeException;

class ResendMailer
{
    public function sendLoginCode(string $to, string $code): void
    {
        $apiKey = config('gocha.resend.api_key');
        if (! $apiKey) {
            if (app()->environment('local', 'testing')) {
                logger()->info('OTP code for '.$to.': '.$code.' (Resend not configured)');

                return;
            }

            throw new RuntimeException('RESEND_API_KEY is not configured.');
        }

        $ttl = (int) config('gocha.auth.otp_ttl_minutes', 10);
        $from = config('gocha.resend.from');

        $html = <<<HTML
<p>Your Gotcha sign-in code is:</p>
<p style="font-size:28px;font-weight:600;">{$code}</p>
<p>This code expires in {$ttl} minutes.</p>
<p>If you did not request this code, you can ignore this email.</p>
HTML;

        $client = new Client([
            'base_uri' => 'https://api.resend.com/',
            'timeout' => 15,
        ]);

        $response = $client->post('emails', [
            'headers' => [
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
                'Idempotency-Key' => Str::uuid()->toString(),
            ],
            'json' => [
                'from' => $from,
                'to' => [$to],
                'subject' => 'Your Gotcha sign-in code',
                'html' => $html,
            ],
        ]);

        if ($response->getStatusCode() >= 400) {
            throw new RuntimeException('Resend API returned an error.');
        }
    }
}
