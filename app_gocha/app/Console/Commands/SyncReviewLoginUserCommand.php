<?php

namespace App\Console\Commands;

use App\Services\Auth\ReviewLoginService;
use Illuminate\Console\Command;

class SyncReviewLoginUserCommand extends Command
{
    protected $signature = 'gocha:sync-review-login-user';

    protected $description = 'Create or update the configured Google review login user from env.';

    public function handle(ReviewLoginService $reviewLogin): int
    {
        if (! $reviewLogin->isEnabled()) {
            $this->error('Set GOCHA_REVIEW_LOGIN_EMAIL and GOCHA_REVIEW_LOGIN_PASSWORD first.');

            return self::FAILURE;
        }

        $user = $reviewLogin->ensureUser();
        $this->info('Review login user ready: '.$user->email.' (id '.$user->id.')');

        return self::SUCCESS;
    }
}
