<?php

namespace App\Console\Commands;

use App\Models\PipelineHeartbeat;
use App\Services\Alerts\SuperAdminAlerter;
use App\Support\CorrelationId;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CatchUpWatchdogCommand extends Command
{
    protected $signature = 'gocha:catch-up-watchdog';

    protected $description = 'Alert when the Catch Up pipeline heartbeat is stale or lock skips pile up.';

    public function handle(SuperAdminAlerter $alerts): int
    {
        $lockDomain = (string) config('gocha.catch_up.lock_domain', 'catch-up-generate');
        $staleMinutes = (int) config('gocha.catch_up.heartbeat_stale_minutes', 20);
        $skipThreshold = (int) config('gocha.catch_up.watchdog_skip_threshold', 3);
        $correlationId = CorrelationId::current();
        $heartbeat = PipelineHeartbeat::query()->where('lock_domain', $lockDomain)->first();

        $stale = ! $heartbeat
            || ! $heartbeat->completed_at
            || $heartbeat->completed_at->lt(now()->subMinutes($staleMinutes));

        $skipStreak = (int) ($heartbeat?->skip_streak ?? 0);
        $skipped = $skipStreak >= $skipThreshold;

        if (! $stale && ! $skipped) {
            $this->info('catch_up_watchdog=ok');

            return self::SUCCESS;
        }

        $parts = [];
        if ($stale) {
            $age = $heartbeat?->completed_at
                ? $heartbeat->completed_at->diffForHumans()
                : 'never';
            $parts[] = 'Heartbeat last completed '.$age.' (SLA '.$staleMinutes.' minutes).';
        }
        if ($skipped) {
            $parts[] = 'Lock skip streak is '.$skipStreak.' (threshold '.$skipThreshold.').';
        }

        $error = implode(' ', $parts);
        Log::warning('gocha.catch_up.watchdog', [
            'lock_domain' => $lockDomain,
            'correlation_id' => $correlationId,
            'error' => $error,
        ]);
        $alerts->send('catch-up', 'catch-up-watchdog', $error, 'none', $correlationId);
        $this->warn('catch_up_watchdog=alert');

        return self::SUCCESS;
    }
}
