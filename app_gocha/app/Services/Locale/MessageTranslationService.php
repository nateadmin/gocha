<?php

namespace App\Services\Locale;

use App\Models\Message;
use App\Models\User;
use App\Services\Ai\MeteredOpenAiClient;
use App\Support\AppLanguage;
use Illuminate\Support\Facades\Log;
use Throwable;

class MessageTranslationService
{
    public const PER_REQUEST_REMOTE_LIMIT = 8;

    public function __construct(private readonly MeteredOpenAiClient $openai) {}

    /**
     * @return array{text: string, originalText: string, isTranslated: bool, sourceLanguage: string|null}
     */
    public function decorate(Message $message, User $viewer, ?TranslationBudget $budget = null): array
    {
        $body = (string) $message->body;
        $original = [
            'text' => $body,
            'originalText' => $body,
            'isTranslated' => false,
            'sourceLanguage' => $this->storedSource($message),
        ];

        if ((int) $message->sender_user_id === (int) $viewer->id) {
            return $original;
        }

        if ($body === '' || preg_match('/\p{L}/u', $body) !== 1) {
            return $original;
        }

        $target = AppLanguage::normalize((string) ($viewer->language ?? '')) ?? AppLanguage::DEFAULT;
        $cached = $this->cachedForTarget($message, $target);
        if ($cached !== null) {
            return $cached;
        }

        $storedSource = $this->storedSource($message);
        $heuristic = $storedSource ?? AppLanguage::detectScriptLanguage($body);

        if ($heuristic === $target) {
            $this->rememberSource($message, $heuristic);

            return [
                'text' => $body,
                'originalText' => $body,
                'isTranslated' => false,
                'sourceLanguage' => $heuristic,
            ];
        }

        if ($heuristic === null && $target === 'en' && AppLanguage::looksLikeEnglish($body)) {
            $this->rememberSource($message, 'en');

            return [
                'text' => $body,
                'originalText' => $body,
                'isTranslated' => false,
                'sourceLanguage' => 'en',
            ];
        }

        if ($budget !== null && ! $budget->consume()) {
            return $original;
        }

        try {
            $remote = $this->translateRemote($body, $target, (string) $message->id);
        } catch (Throwable $e) {
            Log::warning('gocha.message.translate_failed', [
                'message_id' => $message->id,
                'target' => $target,
                'error' => $e->getMessage(),
            ]);

            return $original;
        }

        $source = AppLanguage::normalize($remote['source']) ?? $heuristic;
        $translated = $remote['text'];
        $this->storeResult($message, $target, $source, $translated);

        $same = $source === $target || $translated === $body;

        return [
            'text' => $same ? $body : $translated,
            'originalText' => $body,
            'isTranslated' => ! $same,
            'sourceLanguage' => $source,
        ];
    }

    /**
     * Cached translation only. Used for conversation list previews so a list
     * load never opens a new OpenAI call.
     *
     * @return array{text: string, originalText: string, isTranslated: bool, sourceLanguage: string|null}
     */
    public function decorateCached(Message $message, User $viewer): array
    {
        $body = (string) $message->body;
        $target = AppLanguage::normalize((string) ($viewer->language ?? '')) ?? AppLanguage::DEFAULT;
        $cached = $this->cachedForTarget($message, $target);
        if ($cached !== null) {
            return $cached;
        }

        return [
            'text' => $body,
            'originalText' => $body,
            'isTranslated' => false,
            'sourceLanguage' => $this->storedSource($message),
        ];
    }

    /**
     * @return array{text: string, originalText: string, isTranslated: bool, sourceLanguage: string|null}|null
     */
    private function cachedForTarget(Message $message, string $target): ?array
    {
        $body = (string) $message->body;
        $meta = is_array($message->metadata) ? $message->metadata : [];
        $source = $this->storedSource($message);
        $translations = is_array($meta['translations'] ?? null) ? $meta['translations'] : [];

        if ($source === $target) {
            return [
                'text' => $body,
                'originalText' => $body,
                'isTranslated' => false,
                'sourceLanguage' => $source,
            ];
        }

        $translated = $translations[$target] ?? null;
        if (is_string($translated) && $translated !== '') {
            return [
                'text' => $translated,
                'originalText' => $body,
                'isTranslated' => $translated !== $body,
                'sourceLanguage' => $source,
            ];
        }

        return null;
    }

    private function storedSource(Message $message): ?string
    {
        $meta = is_array($message->metadata) ? $message->metadata : [];
        $source = $meta['source_language'] ?? null;

        return is_string($source) ? AppLanguage::normalize($source) : null;
    }

    private function rememberSource(Message $message, string $source): void
    {
        $meta = is_array($message->metadata) ? $message->metadata : [];
        if (($meta['source_language'] ?? null) === $source) {
            return;
        }

        $meta['source_language'] = $source;
        $message->forceFill(['metadata' => $meta])->save();
    }

    private function storeResult(Message $message, string $target, ?string $source, string $translated): void
    {
        $meta = is_array($message->metadata) ? $message->metadata : [];
        if ($source) {
            $meta['source_language'] = $source;
        }
        if ($source !== $target && $translated !== '' && $translated !== $message->body) {
            $existing = is_array($meta['translations'] ?? null) ? $meta['translations'] : [];
            $existing[$target] = $translated;
            $meta['translations'] = $existing;
        }
        $message->forceFill(['metadata' => $meta])->save();
    }

    /**
     * @return array{source: string|null, text: string}
     */
    private function translateRemote(string $body, string $target, string $correlationId): array
    {
        $maxTokens = min(2000, max(240, (int) ceil(strlen($body) / 2) + 80));

        $decoded = $this->openai->chatJson([
            [
                'role' => 'system',
                'content' => 'You detect the language of a chat message and translate it. '
                    .'Reply with JSON keys source (ISO 639-1) and text. '
                    .'If the message is already in the target language, set source to that language and text to the original. '
                    .'Keep names, emojis, mentions, and URLs. Do not add commentary.',
            ],
            [
                'role' => 'user',
                'content' => "Target language: {$target}\nMessage:\n{$body}",
            ],
        ], 'msg-'.$correlationId, 'message-translate', $maxTokens);

        $text = $decoded['text'] ?? $decoded['translation'] ?? $body;
        $source = $decoded['source'] ?? $decoded['language'] ?? null;

        return [
            'source' => is_string($source) ? $source : null,
            'text' => is_string($text) && $text !== '' ? $text : $body,
        ];
    }
}
