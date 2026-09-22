<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        ]);

        $user = $this->reviewLogin->attempt($validated['email'], $validated['password']);
        if (! $user) {
            return response()->json([
                'code' => 'INVALID_CREDENTIALS',
                'message' => 'That email or password is incorrect.',
            ], 401);
        }

        Auth::login($user, remember: true);

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
