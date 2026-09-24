<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\AccountLinkService;
use App\Services\Auth\DeviceTokenService;
use App\Services\Auth\ReviewLoginService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthReviewLoginController extends Controller
{
    public function __construct(
        private readonly ReviewLoginService $reviewLogin,
        private readonly DeviceTokenService $deviceTokens,
        private readonly AccountLinkService $accountLinks,
    ) {}

    public function login(Request $request): JsonResponse
    {
        if (! $this->reviewLogin->isEnabled()) {
            return response()->json([
                'code' => 'REVIEW_LOGIN_DISABLED',
                'message' => 'Password sign-in is not available.',
            ], 404);
        }

        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'linkCurrentAccount' => ['sometimes', 'boolean'],
        ]);

        $user = $this->reviewLogin->attempt($validated['email'], $validated['password']);
        if (! $user) {
            return response()->json([
                'code' => 'INVALID_CREDENTIALS',
                'message' => 'That email or password is incorrect.',
            ], 401);
        }

        if ($validated['linkCurrentAccount'] ?? false) {
            $actor = $request->user();
            if (! $actor instanceof User) {
                $resolved = $this->deviceTokens->resolveUser($request->bearerToken());
                $actor = $resolved instanceof User ? $resolved : null;
            }
            if (! $actor) {
                return response()->json([
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Sign in to your current account before linking another.',
                ], 401);
            }
            if ($actor->id !== $user->id) {
                $this->accountLinks->link($actor, $user);
            }
        }

        Auth::login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $deviceToken = $this->deviceTokens->issue($user);

        return response()->json([
            'user' => $user->load('activeBusinessListing')->toAuthPayload(),
            'deviceToken' => $deviceToken->plainTextToken,
            'account' => $user->toAccountSwitcherPayload(),
        ]);
    }
}
