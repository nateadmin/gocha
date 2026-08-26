<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Profile\CharacterAvatarService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ProvisionUserCommand extends Command
{
    protected $signature = 'gocha:provision-user
                            {email : Email address for the user directory entry}
                            {--name= : Display name}
                            {--discoverable : Mark profile discoverable in global search}';

    protected $description = 'Provision a user in the closed membership directory without sending OTP.';

    public function handle(CharacterAvatarService $avatars): int
    {
        $email = Str::lower(trim($this->argument('email')));
        $displayName = $this->option('name') ?: Str::before($email, '@');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $displayName,
                'display_name' => $displayName,
                'password' => Str::password(32),
                'discoverable' => (bool) $this->option('discoverable'),
                'onboarding_completed_at' => now(),
            ],
        );

        if (! $user->avatar_path) {
            $avatars->assignDefault($user);
        }

        $this->info('Provisioned '.$email.' (id '.$user->id.')');

        return self::SUCCESS;
    }
}
