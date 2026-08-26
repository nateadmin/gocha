<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\NewAccessToken;

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
