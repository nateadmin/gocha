<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Profile\CharacterAvatarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly CharacterAvatarService $avatars) {}

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->toAuthPayload(),
        ]);
    }

    public function completeOnboarding(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'displayName' => ['required', 'string', 'max:80'],
            'status' => ['nullable', 'string', 'max:160'],
            'bio' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:32'],
            'discoverable' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        $user->forceFill([
            'display_name' => $validated['displayName'],
            'name' => $validated['displayName'],
            'status' => $validated['status'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'discoverable' => $validated['discoverable'] ?? false,
            'onboarding_completed_at' => now(),
        ])->save();

        return response()->json([
            'user' => $user->fresh()->toAuthPayload(),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'file', 'image', 'max:2048'],
        ]);

        $file = $validated['avatar'];
        $extension = strtolower($file->extension() ?: 'png');
        $this->avatars->storeUpload(
            $request->user(),
            $file->get(),
            $extension,
        );

        return response()->json([
            'user' => $request->user()->fresh()->toAuthPayload(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $needle = $validated['q'];

        $results = User::query()
            ->where('discoverable', true)
            ->where(function ($query) use ($needle) {
                $query->where('display_name', 'like', '%'.$needle.'%')
                    ->orWhere('name', 'like', '%'.$needle.'%')
                    ->orWhere('email', 'like', '%'.$needle.'%');
            })
            ->orderBy('display_name')
            ->limit(20)
            ->get()
            ->map(fn (User $user) => $user->toPublicProfilePayload())
            ->values();

        return response()->json([
            'results' => $results,
        ]);
    }
}
