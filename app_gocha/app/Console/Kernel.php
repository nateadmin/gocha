<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('gocha:catch-up-generate')
            ->everyFiveMinutes()
            ->withoutOverlapping(4);

        $schedule->command('gocha:catch-up-watchdog')
            ->everyTenMinutes();

        $schedule->command('gocha:status-prune')
            ->hourly()
            ->withoutOverlapping(10);
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
