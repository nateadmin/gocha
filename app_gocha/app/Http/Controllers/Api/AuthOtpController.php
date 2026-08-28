<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OtpVerificationException;
use App\Http\Controllers\Controller;
use App\Services\Auth\AccountIdentifierService;
use App\Services\Auth\DeviceTokenService;
use App\Services\Auth\OtpAuthService;
use App\Support\AccountChannel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthOtpController extends Controller
{
    public function __construct(
        private readonly OtpAuthService $otpAuth,
        private readonly DeviceTokenService $deviceTokens,
        private readonly AccountIdentifierService $identifiers,
    ) {}

    public function request(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['sometimes', 'string', Rule::in(AccountChannel::all())],
            'identifier' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email:rfc', 'max:255'],
            'mode' => ['required', 'string', 'in:signin,signup'],
        ]);

        [$channel, $identifier] = $this->resolveChannelIdentifier($validated);

        $payload = $this->otpAuth->requestCode($channel, $identifier, $validated['mode']);

        return response()->json($payload);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['sometimes', 'string', Rule::in(AccountChannel::all())],
            'identifier' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email:rfc', 'max:255'],
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
            'mode' => ['required', 'string', 'in:signin,signup'],
        ]);

        [$channel, $identifier] = $this->resolveChannelIdentifier($validated);

        try {
            $user = $this->otpAuth->verifyCode(
                $channel,
                $identifier,
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

        $deviceToken = $this->deviceTokens->issue($user);

        return response()->json([
            'user' => $user->load('activeBusinessListing')->toAuthPayload(),
            'deviceToken' => $deviceToken->plainTextToken,
            'account' => $user->toAccountSwitcherPayload(),
        ]);
    }

    /**
     * Exchanges a stored device token for a web session login. This is how
     * account switching changes the server-side identity: on stateful (web)
     * requests the session cookie takes precedence over bearer tokens, so the
     * session itself must be re-logged-in as the target account.
     */
    public function switchSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'deviceToken' => ['required', 'string', 'max:512'],
        ]);

        $user = $this->deviceTokens->resolveUser($validated['deviceToken']);
        if (! $user) {
            return response()->json([
                'code' => 'INVALID_DEVICE_TOKEN',
                'message' => 'This account needs to sign in again.',
            ], 401);
        }

        Auth::guard('web')->login($user, remember: true);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Rotate the device token so the presented credential is single-use.
        $this->deviceTokens->revokeCurrent($validated['deviceToken']);
        $deviceToken = $this->deviceTokens->issue($user);

        return response()->json([
            'user' => $user->load('activeBusinessListing')->toAuthPayload(),
            'deviceToken' => $deviceToken->plainTextToken,
            'account' => $user->toAccountSwitcherPayload(),
        ]);
    }

    public function issueDeviceToken(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401, 'Sign in required.');
        }

        $deviceToken = $this->deviceTokens->issue($user);

        return response()->json([
            'deviceToken' => $deviceToken->plainTextToken,
            'account' => $user->toAccountSwitcherPayload(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->deviceTokens->revokeCurrent($request->bearerToken());

        $deviceOnly = $request->boolean('device_only');

        if (! $deviceOnly) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return response()->json([
            'message' => 'Signed out.',
        ]);
    }

  /**
     * @param  array<string, mixed>  $validated
     * @return array{0: string, 1: string}
     */
    private function resolveChannelIdentifier(array $validated): array
    {
        if (isset($validated['channel'], $validated['identifier'])) {
            return [
                $validated['channel'],
                $this->identifiers->normalize($validated['channel'], $validated['identifier']),
            ];
        }

        if (isset($validated['email'])) {
            $legacy = $this->identifiers->channelFromLegacyEmail($validated['email']);

            return [$legacy['channel'], $legacy['identifier']];
        }

        throw ValidationException::withMessages([
            'identifier' => ['Provide channel and identifier, or email.'],
        ]);
    }
}
