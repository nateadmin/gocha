<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessListing;
use App\Models\User;
use App\Services\Business\BusinessListingService;
use App\Services\Profile\CharacterAvatarService;
use App\Services\Profile\DiscoverableUserSearch;
use App\Support\AppLanguage;
use App\Support\ProfileMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function __construct(
        private readonly CharacterAvatarService $avatars,
        private readonly BusinessListingService $businesses,
        private readonly DiscoverableUserSearch $discoverableUserSearch,
    ) {}

    public function me(Request $request): JsonResponse
    {
        $user = $this->ensureAvatar($request->user())->load('activeBusinessListing');

        return response()->json([
            'user' => $user->toAuthPayload(),
        ]);
    }

    public function completeOnboarding(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'displayName' => ['required', 'string', 'max:80'],
            'username' => [
                'nullable',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'status' => ['nullable', 'string', 'max:160'],
            'bio' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'discoverable' => ['sometimes', 'boolean'],
            'language' => ['sometimes', 'nullable', 'string', 'max:16'],
        ]);

        $language = AppLanguage::normalize($validated['language'] ?? null);

        $user->forceFill([
            'name' => $validated['displayName'],
            'username' => isset($validated['username'])
                ? strtolower($validated['username'])
                : $user->username,
            'status' => $validated['status'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'discoverable' => $validated['discoverable'] ?? false,
            'language' => $language ?? $user->language,
            'onboarding_completed_at' => now(),
        ])->save();

        $user = $this->ensureAvatar($user)->fresh()->load('activeBusinessListing');

        return response()->json([
            'user' => $user->toAuthPayload(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'displayName' => ['required', 'string', 'max:80'],
            'status' => ['nullable', 'string', 'max:160'],
            'bio' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:32'],
            'discoverable' => ['sometimes', 'boolean'],
            'language' => ['sometimes', 'nullable', 'string', 'max:16'],
        ]);

        $language = AppLanguage::normalize($validated['language'] ?? null);

        $user->forceFill([
            'name' => $validated['displayName'],
            'status' => $validated['status'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'discoverable' => array_key_exists('discoverable', $validated)
                ? $validated['discoverable']
                : $user->discoverable,
            'language' => $language ?? $user->language,
        ])->save();

        $user = $this->ensureAvatar($user)->fresh()->load('activeBusinessListing');

        return response()->json([
            'user' => $user->toAuthPayload(),
        ]);
    }

    public function updateContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['sometimes', 'email:rfc', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:32'],
        ]);

        $user = $request->user();

        if (isset($validated['email'])) {
            $this->businesses->attachContactEmail($user, $validated['email']);
        }

        if (isset($validated['phone'])) {
            $this->businesses->attachContactPhone($user, $validated['phone']);
        }

        return response()->json([
            'user' => $user->fresh()->load('activeBusinessListing')->toAuthPayload(),
        ]);
    }

    public function updateProfileMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'profileMode' => ['required', 'string', Rule::in(ProfileMode::all())],
            'businessChatName' => ['nullable', 'string', 'max:120'],
            'businessChatWebsite' => ['nullable', 'string', 'max:255', 'url'],
            'activeBusinessListingId' => ['nullable', 'integer', 'exists:business_listings,id'],
        ]);

        $user = $request->user();

        if (
            $validated['profileMode'] === ProfileMode::BUSINESS
            && isset($validated['activeBusinessListingId'])
        ) {
            $ownsListing = BusinessListing::query()
                ->where('id', $validated['activeBusinessListingId'])
                ->where('owner_user_id', $user->id)
                ->exists();

            if (! $ownsListing) {
                return response()->json([
                    'code' => 'FORBIDDEN',
                    'message' => 'You can only use your own business listings in business chat mode.',
                ], 403);
            }
        }

        $user->forceFill([
            'profile_mode' => $validated['profileMode'],
            'business_chat_name' => $validated['businessChatName'] ?? null,
            'business_chat_website' => $validated['businessChatWebsite'] ?? null,
            'active_business_listing_id' => $validated['activeBusinessListingId'] ?? null,
        ])->save();

        return response()->json([
            'user' => $user->fresh()->load('activeBusinessListing')->toAuthPayload(),
        ]);
    }

    public function updateLanguage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'language' => ['required', 'string', 'max:16'],
        ]);

        $language = AppLanguage::normalize($validated['language']);
        if ($language === null) {
            return response()->json([
                'code' => 'INVALID_LANGUAGE',
                'message' => 'That language is not supported.',
            ], 422);
        }

        $user = $request->user();
        $user->forceFill(['language' => $language])->save();

        return response()->json([
            'user' => $user->fresh()->load('activeBusinessListing')->toAuthPayload(),
        ]);
    }

    public function updateUsername(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
        ]);

        $user->forceFill([
            'username' => strtolower($validated['username']),
        ])->save();

        return response()->json([
            'user' => $user->fresh()->load('activeBusinessListing')->toAuthPayload(),
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
            $file->getContent(),
            $extension,
        );

        return response()->json([
            'user' => $request->user()->fresh()->load('activeBusinessListing')->toAuthPayload(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $needle = $validated['q'];

        $results = $this->discoverableUserSearch
            ->search($request->user(), $needle)
            ->map(fn (User $user) => $user->toPublicProfilePayload())
            ->values();

        return response()->json([
            'results' => $results,
        ]);
    }

    private function ensureAvatar(User $user): User
    {
        if (! $user->avatar_path) {
            $this->avatars->assignDefault($user);
            $user = $user->fresh();
        }

        return $user;
    }
}
