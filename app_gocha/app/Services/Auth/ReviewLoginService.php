<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\Profile\CharacterAvatarService;
use App\Support\AccountChannel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ReviewLoginService
{
    public function __construct(private readonly CharacterAvatarService $avatars) {}

    public function isEnabled(): bool
    {
        $email = $this->configuredEmail();

        return $email !== null && $this->configuredPassword() !== null;
    }

    public function configuredEmail(): ?string
    {
        $email = config('gocha.review_login.email');

        return is_string($email) && trim($email) !== ''
            ? Str::lower(trim($email))
            : null;
    }

    public function attempt(string $email, string $password): ?User
    {
        if (! $this->isEnabled()) {
            return null;
        }

        $normalized = Str::lower(trim($email));
        $expectedPassword = $this->configuredPassword();

        if (
            $normalized !== $this->configuredEmail()
            || $expectedPassword === null
            || ! hash_equals($expectedPassword, $password)
        ) {
            return null;
        }

        return $this->ensureUser();
    }

    public function ensureUser(): User
    {
        $email = $this->configuredEmail();
        $password = $this->configuredPassword();

        if ($email === null || $password === null) {
            throw new \RuntimeException('Review login is not configured.');
        }

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => (string) config('gocha.review_login.name', 'Google Review'),
                'password' => $password,
                'primary_login_channel' => AccountChannel::EMAIL,
                'discoverable' => false,
                'onboarding_completed_at' => now(),
                'email_verified_at' => now(),
            ],
        );

        $updates = [];
        if (! $user->email_verified_at) {
            $updates['email_verified_at'] = now();
        }
        if ($user->needsOnboarding()) {
            $updates['onboarding_completed_at'] = now();
        }
        if ($updates !== []) {
            $user->forceFill($updates)->save();
        }

        if (! Hash::check($password, (string) $user->password)) {
            $user->forceFill(['password' => $password])->save();
        }

        if (! $user->avatar_path) {
            $this->avatars->assignDefault($user);
        }

        return $user->fresh();
    }

    private function configuredPassword(): ?string
    {
        $password = config('gocha.review_login.password');

        return is_string($password) && $password !== '' ? $password : null;
    }
}
