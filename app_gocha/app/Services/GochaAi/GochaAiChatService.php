<?php

namespace App\Services\GochaAi;

use App\Models\User;
use App\Services\Ai\MeteredOpenAiClient;
use App\Services\Ai\OpenAiBudgetExceededException;
use App\Services\Ai\OpenAiCircuitOpenException;
use Illuminate\Support\Str;
use RuntimeException;

class GochaAiChatService
{
    public function __construct(private readonly MeteredOpenAiClient $openAi)
    {
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function reply(User $user, string $message, array $history = []): string
    {
        $trimmed = trim($message);
        if ($trimmed === '') {
            throw new RuntimeException('Message is empty.');
        }

        $maxHistory = (int) config('gocha.gocha_ai.max_history', 20);
        $history = array_slice($this->sanitizeHistory($history), -$maxHistory);

        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt($user)],
            ...$history,
            ['role' => 'user', 'content' => $trimmed],
        ];

        $correlationId = 'gocha-ai-'.Str::uuid()->toString();

        try {
            $reply = $this->openAi->chatText(
                $messages,
                $correlationId,
                'gocha-ai-chat',
                (int) config('gocha.gocha_ai.max_tokens', 600),
            );
        } catch (OpenAiCircuitOpenException|OpenAiBudgetExceededException $e) {
            return 'I am busy right now. Please try again in a few minutes.';
        }

        return $this->sanitizeReply($reply);
    }

    private function systemPrompt(User $user): string
    {
        $name = trim($user->chatDisplayName() ?: $user->name ?: 'there');
        $rules = config('gocha.ai.style_rules', []);
        $ruleText = is_array($rules) && $rules !== []
            ? implode(' ', array_map(fn ($rule) => (string) $rule, $rules))
            : '';

        return 'You are Gocha AI, the built-in assistant in the Gocha messaging app. '
            .'You help '.$name.' with everyday questions, planning, writing, local recommendations, and getting things done. '
            .'Be concise, friendly, and practical. Use short paragraphs. '
            .'If you are unsure, say so. Do not invent live prices, inventory, or booking confirmations. '
            .$ruleText;
    }

    /**
     * @param  array<int, mixed>  $history
     * @return array<int, array{role: string, content: string}>
     */
    private function sanitizeHistory(array $history): array
    {
        $out = [];
        foreach ($history as $item) {
            if (! is_array($item)) {
                continue;
            }
            $role = $item['role'] ?? null;
            $content = $item['content'] ?? null;
            if (! in_array($role, ['user', 'assistant'], true)) {
                continue;
            }
            if (! is_string($content) || trim($content) === '') {
                continue;
            }
            $out[] = [
                'role' => $role,
                'content' => Str::limit(trim($content), 4000, ''),
            ];
        }

        return $out;
    }

    private function sanitizeReply(string $reply): string
    {
        $text = trim($reply);
        foreach (config('gocha.ai.forbidden_characters', []) as $char) {
            if (is_string($char) && $char !== '') {
                $text = str_replace($char, ',', $text);
            }
        }

        return $text !== '' ? $text : 'Sorry, I could not form a reply. Please try again.';
    }
}
