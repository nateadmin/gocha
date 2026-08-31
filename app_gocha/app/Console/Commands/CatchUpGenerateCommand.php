<?php

namespace App\Console\Commands;

use App\Services\CatchUp\CatchUpBriefGenerator;
use App\Support\CorrelationId;
use Illuminate\Console\Command;

class CatchUpGenerateCommand extends Command
{
    protected $signature = 'gocha:catch-up-generate';

    protected $description = 'Generate Catch Up briefs from recent conversation messages.';

    public function handle(CatchUpBriefGenerator $generator): int
    {
        $correlationId = CorrelationId::current();
        $written = $generator->generate($correlationId);
        $this->info('catch_up_briefs_written='.$written);

        return self::SUCCESS;
    }
}
