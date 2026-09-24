<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Auth\AccountLinkService;
use App\Services\Auth\DeviceTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountLinkController extends Controller
{
    public function __construct(
        private readonly AccountLinkService $links,
        private readonly DeviceTokenService $deviceTokens,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'accounts' => $this->links->linkedUsers($user)
                ->map(fn ($linked) => $linked->toAccountSwitcherPayload())
                ->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'counterpartDeviceToken' => ['required', 'string', 'max:512'],
        ]);

        $actor = $request->user();
        $counterpart = $this->deviceTokens->resolveUser($validated['counterpartDeviceToken']);
        if (! $counterpart) {
            return response()->json([
                'code' => 'INVALID_DEVICE_TOKEN',
                'message' => 'The other account needs to sign in again before it can be linked.',
            ], 401);
        }

        if ($counterpart->id === $actor->id) {
            return response()->json([
                'code' => 'CANNOT_LINK_SELF',
                'message' => 'You cannot link an account to itself.',
            ], 422);
        }

        $this->links->link($actor, $counterpart);

        return response()->json([
            'accounts' => $this->links->linkedUsers($actor)
                ->map(fn ($linked) => $linked->toAccountSwitcherPayload())
                ->values(),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $actor = $request->user();
        $this->links->unlink($actor, (int) $validated['userId']);

        return response()->json([
            'accounts' => $this->links->linkedUsers($actor)
                ->map(fn ($linked) => $linked->toAccountSwitcherPayload())
                ->values(),
        ]);
    }
}
