<?php

namespace App\Services\Alerts;

use App\Support\CorrelationId;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SuperAdminAlerter
{
    public function send(
        string $app,
        string $operation,
        string $error,
        string $retries = 'none',
        ?string $correlationId = null,
    ): void {
        if (app()->environment('testing')) {
            return;
        }

        $fingerprint = sha1($app.'|'.$operation.'|'.$error);
        if (! Cache::add('gocha:alert:'.$fingerprint, 1, now()->addMinutes(30))) {
            return;
        }

        $to = (string) config('gocha.alerts.to', 'nate@wefoundd.com');
        $apiKey = config('gocha.resend.api_key');
        $from = config('gocha.resend.from');
        $host = config('gocha.planned_hostname', 'gocha.ai');
        $environment = app()->environment();
        $time = now()->utc()->toIso8601String();
        $correlationId ??= CorrelationId::current();

        $subject = '[Gocha] ['.$app.'] '.$operation.' failed';
        $body = implode("\n", [
            'Project: Gocha',
            'App: '.$app,
            'Host: '.$host,
            'Environment: '.$environment,
            'Operation: '.$operation,
            'Time (UTC): '.$time,
            'Error: '.$error,
            'Retries: '.$retries,
            'Correlation id: '.$correlationId,
        ]);

        Log::warning('gocha.alert', [
            'app' => $app,
            'operation' => $operation,
            'error' => $this->oneLine($error),
            'correlation_id' => $correlationId,
        ]);

        if (! $apiKey) {
            return;
        }

        try {
            Http::timeout(15)
                ->connectTimeout(5)
                ->withToken($apiKey)
                ->withHeaders([
                    'Idempotency-Key' => Str::uuid()->toString(),
                ])
                ->post('https://api.resend.com/emails', [
                    'from' => $from,
                    'to' => [$to],
                    'subject' => $subject,
                    'text' => $body,
                ]);
        } catch (\Throwable $e) {
            Log::error('gocha.alert_send_failed', [
                'operation' => $operation,
                'error' => $this->oneLine($e->getMessage()),
            ]);
        }
    }

    private function oneLine(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    }
}
