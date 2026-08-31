<?php

namespace App\Services\CatchUp;

use App\Models\CatchUpBrief;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\PipelineHeartbeat;
use App\Models\User;
use App\Services\Ai\MeteredOpenAiClient;
use App\Services\Ai\OpenAiBudgetExceededException;
use App\Services\Ai\OpenAiCircuitOpenException;
use App\Services\Alerts\SuperAdminAlerter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class CatchUpBriefGenerator
{
    public function __construct(
        private MeteredOpenAiClient $openAi,
        private CatchUpBriefValidator $validator,
        private SuperAdminAlerter $alerts,
    ) {
    }

    public function generate(string $correlationId): int
    {
        $lockDomain = (string) config('gocha.catch_up.lock_domain', 'catch-up-generate');
        $lockSeconds = (int) config('gocha.catch_up.lock_seconds', 240);
        $lock = Cache::lock($lockDomain, $lockSeconds);

        if (! $lock->get()) {
            Log::info('skipped_lock_held', [
                'lock_domain' => $lockDomain,
                'job' => 'gocha:catch-up-generate',
                'correlation_id' => $correlationId,
            ]);
            $this->recordSkip($lockDomain);
            return 0;
        }

        $started = microtime(true);
        $written = 0;
        $failures = 0;

        try {
            $participants = ConversationParticipant::query()
                ->whereHas('conversation', fn ($query) => $query->whereNotNull('last_message_at'))
                ->orderBy('id')
                ->get();

            $maxRun = (int) config('gocha.catch_up.max_run_seconds', 240);
            $maxCalls = (int) config('gocha.catch_up.max_calls_per_run', 40);
            $calls = 0;

            foreach ($participants as $participant) {
                if ((microtime(true) - $started) >= ($maxRun - 20)) {
                    Log::warning('gocha.catch_up.time_cap', [
                        'correlation_id' => $correlationId,
                        'written' => $written,
                    ]);
                    break;
                }

                if ($calls >= $maxCalls) {
                    break;
                }

                try {
                    $didCall = $this->refreshBrief($participant, $correlationId);
                    if ($didCall) {
                        $calls++;
                        $written++;
                    }
                } catch (OpenAiCircuitOpenException|OpenAiBudgetExceededException $e) {
                    Log::warning('gocha.catch_up.stopped', [
                        'correlation_id' => $correlationId,
                        'reason' => $e->getMessage(),
                    ]);
                    break;
                } catch (Throwable $e) {
                    $failures++;
                    Log::warning('gocha.catch_up.brief_failed', [
                        'correlation_id' => $correlationId,
                        'user_id' => $participant->user_id,
                        'conversation_id' => $participant->conversation_id,
                        'error' => $this->oneLine($e->getMessage()),
                    ]);
                }
            }

            $this->recordSuccess($lockDomain, $written, $correlationId);

            if ($failures > 0) {
                $this->alerts->send(
                    'catch-up',
                    'catch-up-generate',
                    $failures.' conversation brief(s) failed after retries in this run.',
                    '3 attempts, 2 seconds apart',
                    $correlationId,
                );
            }

            return $written;
        } finally {
            $lock->release();
        }
    }

    private function refreshBrief(ConversationParticipant $participant, string $correlationId): bool
    {
        $user = User::query()->find($participant->user_id);
        $conversation = Conversation::query()
            ->with('participants')
            ->find($participant->conversation_id);

        if (! $user || ! $conversation) {
            return false;
        }

        $limit = (int) config('gocha.catch_up.max_messages_per_conversation', 20);
        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->with('sender')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        if ($messages->isEmpty()) {
            return false;
        }

        /** @var Message $latest */
        $latest = $messages->last();
        $existing = CatchUpBrief::query()
            ->where('user_id', $user->id)
            ->where('conversation_id', $conversation->id)
            ->first();

        if ($existing && (int) $existing->source_message_id === (int) $latest->id) {
            return false;
        }

        $transcript = $this->assembleTranscript($messages, $user);
        $decoded = $this->openAi->chatJson([
            [
                'role' => 'system',
                'content' => $this->systemPrompt(),
            ],
            [
                'role' => 'user',
                'content' => $transcript,
            ],
        ], $correlationId, 'catch-up-summarize');

        $validated = $this->validator->validate($decoded);

        CatchUpBrief::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'conversation_id' => $conversation->id,
            ],
            [
                'summary' => $validated['summary'],
                'attention' => $validated['attention'],
                'plans' => $validated['plans'],
                'priority' => $validated['priority'],
                'source_message_id' => $latest->id,
                'source_created_at' => $latest->created_at,
                'generated_at' => now(),
            ],
        );

        Log::info('gocha.catch_up.brief_written', [
            'correlation_id' => $correlationId,
            'user_id' => $user->id,
            'conversation_id' => $conversation->id,
            'source_message_id' => $latest->id,
            'message_count' => $messages->count(),
            'priority' => $validated['priority'],
        ]);

        return true;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Message>  $messages
     */
    private function assembleTranscript($messages, User $viewer): string
    {
        $lines = [];
        foreach ($messages as $message) {
            $who = (int) $message->sender_user_id === (int) $viewer->id
                ? 'You'
                : ($message->sender?->chatDisplayName() ?? 'Member');
            $text = trim((string) $message->body);
            if ($text === '') {
                $text = '['.$message->type.']';
            }
            $lines[] = $who.': '.$text;
        }

        return implode("\n", $lines);
    }

    private function systemPrompt(): string
    {
        return implode(' ', [
            'You summarize one chat for the viewer.',
            'Reply with JSON only using this exact shape:',
            '{"summary":"string","attention":["string"],"plans":[{"when":"string","what":"string"}],"priority":"high|medium|low"}',
            'summary is 1 or 2 sentences about what the viewer missed or the current state.',
            'attention lists only items that need the viewer reply or action. Use an empty array if none.',
            'plans lists dated plans mentioned in the messages. Use an empty array if none.',
            'priority is high if the viewer must act soon, medium if useful, low otherwise.',
            'Use only facts from the messages. Do not invent names, times, or plans.',
            'Do not use em dashes or en dashes.',
        ]);
    }

    private function recordSuccess(string $lockDomain, int $written, string $correlationId): void
    {
        PipelineHeartbeat::query()->updateOrCreate(
            ['lock_domain' => $lockDomain],
            [
                'completed_at' => now(),
                'row_count' => $written,
                'correlation_id' => $correlationId,
                'skip_streak' => 0,
                'last_skip_at' => null,
            ],
        );
    }

    private function recordSkip(string $lockDomain): void
    {
        $row = PipelineHeartbeat::query()->firstOrCreate(
            ['lock_domain' => $lockDomain],
            ['skip_streak' => 0],
        );
        $row->forceFill([
            'skip_streak' => ((int) $row->skip_streak) + 1,
            'last_skip_at' => now(),
        ])->save();
    }

    private function oneLine(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    }
}
