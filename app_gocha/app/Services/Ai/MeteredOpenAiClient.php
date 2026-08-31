<?php

namespace App\Services\Ai;

use App\Services\Alerts\SuperAdminAlerter;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MeteredOpenAiClient
{
    public function __construct(private SuperAdminAlerter $alerts)
    {
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array<string, mixed>
     */
    public function chatJson(array $messages, string $correlationId, string $step): array
    {
        if (Cache::get('openai:circuit')) {
            throw new OpenAiCircuitOpenException('OpenAI circuit breaker is open.');
        }

        $hourKey = 'openai:calls:'.now()->format('YmdH');
        if (! Cache::has($hourKey)) {
            Cache::put($hourKey, 0, now()->endOfHour());
        }

        $count = (int) Cache::get($hourKey, 0);
        $budget = (int) config('gocha.openai.hourly_budget', 80);
        if ($count >= $budget) {
            Cache::put('openai:circuit', 1, now()->endOfHour());
            $this->alerts->send(
                'catch-up',
                'openai-budget',
                'OpenAI hourly budget of '.$budget.' calls was reached. Circuit breaker is open until the hour ends.',
                'none',
                $correlationId,
            );
            throw new OpenAiBudgetExceededException('OpenAI hourly budget reached.');
        }

        $apiKey = config('gocha.openai.api_key');
        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('OPENAI_API_KEY is not configured.');
        }

        $model = (string) config('gocha.openai.model', 'gpt-4o-mini');
        $url = rtrim((string) config('gocha.openai.base_url', 'https://api.openai.com/v1'), '/').'/chat/completions';
        if (! str_starts_with($url, 'https://api.openai.com/')) {
            throw new RuntimeException('OpenAI base URL is not allowlisted.');
        }

        $response = $this->postWithRetry($url, $apiKey, [
            'model' => $model,
            'messages' => $messages,
            'response_format' => ['type' => 'json_object'],
            'temperature' => 0.2,
            'max_tokens' => (int) config('gocha.openai.max_tokens', 400),
        ], $correlationId, $step);

        Cache::increment($hourKey);
        $newCount = (int) Cache::get($hourKey, 0);
        $baseline = (int) config('gocha.openai.hourly_baseline', 40);
        if ($baseline > 0 && $newCount > (int) ceil($baseline * 1.5)) {
            if (Cache::add('openai:alert:spike:'.$hourKey, 1, now()->endOfHour())) {
                $this->alerts->send(
                    'catch-up',
                    'openai-spike',
                    'OpenAI usage is '.$newCount.' calls this hour, above 1.5 times the baseline of '.$baseline.'.',
                    'none',
                    $correlationId,
                );
            }
        }

        $payload = $response->json();
        $content = data_get($payload, 'choices.0.message.content');
        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('OpenAI returned an empty completion.');
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded)) {
            throw new RuntimeException('OpenAI returned non-JSON content.');
        }

        Log::info('gocha.openai.call', [
            'correlation_id' => $correlationId,
            'step' => $step,
            'model' => $model,
            'hour_count' => $newCount,
        ]);

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function postWithRetry(
        string $url,
        string $apiKey,
        array $body,
        string $correlationId,
        string $step,
    ): Response {
        $attempts = 3;
        $lastError = null;

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                $response = Http::timeout((int) config('gocha.openai.timeout', 20))
                    ->connectTimeout((int) config('gocha.openai.connect_timeout', 5))
                    ->withToken($apiKey)
                    ->acceptJson()
                    ->post($url, $body);

                if ($response->successful()) {
                    return $response;
                }

                $status = $response->status();
                Log::warning('gocha.openai.http', [
                    'correlation_id' => $correlationId,
                    'step' => $step,
                    'attempt' => $attempt,
                    'status' => $status,
                ]);

                if (in_array($status, [401, 403], true)) {
                    throw new RuntimeException('OpenAI rejected the API key.');
                }

                if (! in_array($status, [408, 429, 502, 503, 504], true) || $attempt === $attempts) {
                    throw new RuntimeException('OpenAI HTTP '.$status);
                }
            } catch (ConnectionException $e) {
                $lastError = $e;
                Log::warning('gocha.openai.timeout', [
                    'correlation_id' => $correlationId,
                    'step' => $step,
                    'attempt' => $attempt,
                ]);
                if ($attempt === $attempts) {
                    throw $e;
                }
            }

            sleep(2);
        }

        throw $lastError ?? new RuntimeException('OpenAI request failed.');
    }
}
