<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OtpVerificationException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\AccountIdentifierService;
use App\Services\Auth\AccountLinkService;
use App\Services\Auth\DeviceTokenService;
use App\Services\Auth\OtpAuthService;
use App\Support\AccountChannel;
use App\Support\AppLanguage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthOtpController extends Controller
{
    public function __construct(
        private readonly OtpAuthService $otpAuth,
        private readonly DeviceTokenService $deviceTokens,
        private readonly AccountIdentifierService $identifiers,
        private readonly AccountLinkService $accountLinks,
    ) {}

    public function request(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['sometimes', 'string', Rule::in(AccountChannel::all())],
            'identifier' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email:rfc', 'max:255'],
            'mode' => ['required', 'string', 'in:signin,signup,link'],
            'recaptchaToken' => ['sometimes', 'nullable', 'string', 'max:8000'],
        ]);

        try {
            [$channel, $identifier] = $this->resolveChannelIdentifier($validated);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'identifier' => [$e->getMessage()],
            ]);
        }
        $actor = $validated['mode'] === 'link' ? $this->requireActor($request) : $this->optionalActor($request);

        $payload = $this->otpAuth->requestCode(
            $channel,
            $identifier,
            $validated['mode'],
            $validated['recaptchaToken'] ?? null,
            $actor,
        );

        return response()->json($payload);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['sometimes', 'string', Rule::in(AccountChannel::all())],
            'identifier' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email:rfc', 'max:255'],
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
            'mode' => ['required', 'string', 'in:signin,signup,link'],
            'firebaseIdToken' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'language' => ['sometimes', 'nullable', 'string', 'max:16'],
            'country' => ['sometimes', 'nullable', 'string', 'max:8'],
        ]);

        try {
            [$channel, $identifier] = $this->resolveChannelIdentifier($validated);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'identifier' => [$e->getMessage()],
            ]);
        }
        $actor = $validated['mode'] === 'link' ? $this->requireActor($request) : $this->optionalActor($request);

        try {
            $user = $this->otpAuth->verifyCode(
                $channel,
                $identifier,
                $validated['code'],
                $validated['mode'],
                $actor,
                $validated['firebaseIdToken'] ?? null,
                [
                    'language' => $validated['language'] ?? null,
                    'country' => $validated['country'] ?? null,
                    'ipCountry' => $this->requestCountry($request),
                ],
            );
        } catch (OtpVerificationException $e) {
            throw $e;
        }

        if ($validated['mode'] === 'link') {
            return response()->json([
                'user' => $user->load('activeBusinessListing')->toAuthPayload(),
            ]);
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

    /**
     * Switches the authenticated session to another linked account, or to the
     * owner of a stored device token. Device-token switches also persist a
     * two-way account link so the pair is available on every device.
     */
    public function switchSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'deviceToken' => ['sometimes', 'nullable', 'string', 'max:512'],
            'userId' => ['sometimes', 'nullable', 'integer'],
        ]);

        $actor = $request->user();
        if (! $actor) {
            $actor = $this->deviceTokens->resolveUser($request->bearerToken());
        }

        $target = null;
        $presentedDeviceToken = $validated['deviceToken'] ?? null;
        $requestedUserId = isset($validated['userId']) ? (int) $validated['userId'] : null;

        if ($requestedUserId && $actor && ($requestedUserId === $actor->id || $this->accountLinks->areLinked($actor->id, $requestedUserId))) {
            $target = User::query()->find($requestedUserId);
            if (! $target) {
                return response()->json([
                    'code' => 'ACCOUNT_NOT_FOUND',
                    'message' => 'That account no longer exists.',
                ], 404);
            }
        } elseif (is_string($presentedDeviceToken) && $presentedDeviceToken !== '') {
            $target = $this->deviceTokens->resolveUser($presentedDeviceToken);
            if (! $target) {
                return response()->json([
                    'code' => 'INVALID_DEVICE_TOKEN',
                    'message' => 'This account needs to sign in again.',
                ], 401);
            }

            if ($actor && $actor->id !== $target->id) {
                $this->accountLinks->link($actor, $target);
            }
        } elseif ($requestedUserId) {
            if (! $actor) {
                return response()->json([
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Sign in required.',
                ], 401);
            }

            return response()->json([
                'code' => 'ACCOUNT_NOT_LINKED',
                'message' => 'Those accounts are not linked.',
            ], 403);
        } else {
            throw ValidationException::withMessages([
                'userId' => ['Provide a linked user id or a device token.'],
            ]);
        }

        Auth::guard('web')->login($target);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        if (is_string($presentedDeviceToken) && $presentedDeviceToken !== '') {
            $this->deviceTokens->revokeCurrent($presentedDeviceToken);
        }

        $deviceToken = $this->deviceTokens->issue($target);

        return response()->json([
            'user' => $target->load('activeBusinessListing')->toAuthPayload(),
            'deviceToken' => $deviceToken->plainTextToken,
            'account' => $target->toAccountSwitcherPayload(),
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

    public function clearSession(Request $request): JsonResponse
    {
        $this->deviceTokens->revokeCurrent($request->bearerToken());
        $this->invalidateWebSession($request);

        return response()->json([
            'message' => 'Session cleared.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->deviceTokens->revokeCurrent($request->bearerToken());

        if (! $request->boolean('device_only')) {
            $this->invalidateWebSession($request);
        }

        return response()->json([
            'message' => 'Signed out.',
        ]);
    }

    private function invalidateWebSession(Request $request): void
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $path = config('session.path', '/');
        $names = array_filter([
            config('session.cookie'),
            Auth::guard('web')->getRecallerName(),
            'XSRF-TOKEN',
        ]);
        $domains = array_unique([
            null,
            config('session.domain'),
            'app.gocha.ai',
            '.app.gocha.ai',
        ], SORT_REGULAR);

        foreach ($names as $name) {
            foreach ($domains as $domain) {
                Cookie::queue(Cookie::forget((string) $name, $path, $domain));
            }
        }
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

    private function requireActor(Request $request): User
    {
        $actor = $this->optionalActor($request);
        if (! $actor) {
            abort(401, 'Sign in required.');
        }

        return $actor;
    }

    private function optionalActor(Request $request): ?User
    {
        $user = $request->user();
        if ($user instanceof User) {
            return $user;
        }

        $resolved = $this->deviceTokens->resolveUser($request->bearerToken());

        return $resolved instanceof User ? $resolved : null;
    }

    private function requestCountry(Request $request): ?string
    {
        return AppLanguage::countryFromRequestHeaders(
            $request->headers->get('CF-IPCountry'),
            $request->headers->get('CloudFront-Viewer-Country'),
            $request->headers->get('X-AppEngine-Country'),
            $request->headers->get('X-Country-Code'),
        );
    }
}
