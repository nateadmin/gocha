<?php

namespace App\Console\Commands;

use App\Services\Status\StatusService;
use Illuminate\Console\Command;

class StatusPruneCommand extends Command
{
    protected $signature = 'gocha:status-prune';

    protected $description = 'Delete expired status updates and their media.';

    public function handle(StatusService $statuses): int
    {
        $removed = $statuses->pruneExpired();
        $this->info('status_items_pruned='.$removed);

        return self::SUCCESS;
    }
}
