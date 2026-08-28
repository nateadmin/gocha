<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;

class DeviceTokenService
{
    public function issue(User $user): NewAccessToken
    {
        $user->tokens()
            ->where('name', 'like', 'device:%')
            ->where('created_at', '<', now()->subYear())
            ->delete();

        return $user->createToken('device:'.Str::uuid(), ['account:access']);
    }

    /**
     * Resolves the user who owns a plain-text device token, or null when the
     * token is unknown, revoked, or not a device token.
     */
    public function resolveUser(?string $plainTextToken): ?User
    {
        if (! $plainTextToken) {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($plainTextToken);
        if (! $accessToken || ! str_starts_with($accessToken->name, 'device:')) {
            return null;
        }

        $user = $accessToken->tokenable;

        return $user instanceof User ? $user : null;
    }

    public function revokeCurrent(?string $plainTextToken): void
    {
        if (! $plainTextToken) {
            return;
        }

        $token = explode('|', $plainTextToken, 2);
        if (count($token) !== 2) {
            return;
        }

        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($plainTextToken);
        if ($accessToken) {
            $accessToken->delete();
        }
    }
}
