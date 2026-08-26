<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OtpVerificationException;
use App\Http\Controllers\Controller;
use App\Services\Auth\OtpAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthOtpController extends Controller
{
    public function __construct(private readonly OtpAuthService $otpAuth) {}

    public function request(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'mode' => ['required', 'string', 'in:signin,signup'],
        ]);

        $payload = $this->otpAuth->requestCode($validated['email'], $validated['mode']);

        return response()->json($payload);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
            'mode' => ['required', 'string', 'in:signin,signup'],
        ]);

        try {
            $user = $this->otpAuth->verifyCode(
                $validated['email'],
                $validated['code'],
                $validated['mode'],
            );
        } catch (OtpVerificationException $e) {
            throw $e;
        }

        Auth::login($user, remember: true);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'user' => $user->toAuthPayload(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Signed out.',
        ]);
    }
}
