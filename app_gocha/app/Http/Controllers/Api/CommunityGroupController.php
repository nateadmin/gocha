<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityGroup;
use App\Support\GroupPrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CommunityGroupController extends Controller
{
    public function discover(): JsonResponse
    {
        $groups = CommunityGroup::query()
            ->where('privacy', GroupPrivacy::PUBLIC)
            ->where('show_in_around_me', true)
            ->orderByDesc('member_count')
            ->get()
            ->filter(fn (CommunityGroup $group) => $group->isDiscoverableInAroundMe())
            ->values()
            ->map(fn (CommunityGroup $group) => $group->toPayload());

        return response()->json(['groups' => $groups]);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $needle = $validated['q'];

        $groups = CommunityGroup::query()
            ->where('privacy', GroupPrivacy::PUBLIC)
            ->where(function ($query) use ($needle) {
                $query->where('name', 'like', '%'.$needle.'%')
                    ->orWhere('description', 'like', '%'.$needle.'%')
                    ->orWhere('city', 'like', '%'.$needle.'%');
            })
            ->orderBy('name')
            ->limit(30)
            ->get()
            ->map(fn (CommunityGroup $group) => $group->toPayload())
            ->values();

        return response()->json(['groups' => $groups]);
    }

    public function mine(Request $request): JsonResponse
    {
        $groups = CommunityGroup::query()
            ->where('owner_user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (CommunityGroup $group) => $group->toPayload())
            ->values();

        return response()->json(['groups' => $groups]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateGroup($request);

        $group = CommunityGroup::query()->create([
            'owner_user_id' => $request->user()->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'privacy' => $validated['privacy'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'show_in_around_me' => (bool) ($validated['show_in_around_me'] ?? false),
            'avatar_label' => $this->avatarLabel($validated['name']),
            'avatar_color' => $this->avatarColor(),
            'member_count' => 1,
        ]);

        return response()->json(['group' => $group->toPayload()], 201);
    }

    public function update(Request $request, CommunityGroup $communityGroup): JsonResponse
    {
        $this->authorizeOwner($request, $communityGroup);

        $validated = $this->validateGroup($request, partial: true, existing: $communityGroup);

        $communityGroup->forceFill([
            'name' => $validated['name'] ?? $communityGroup->name,
            'description' => $validated['description'] ?? $communityGroup->description,
            'privacy' => $validated['privacy'] ?? $communityGroup->privacy,
            'address' => array_key_exists('address', $validated)
                ? $validated['address']
                : $communityGroup->address,
            'city' => array_key_exists('city', $validated)
                ? $validated['city']
                : $communityGroup->city,
            'state' => array_key_exists('state', $validated)
                ? $validated['state']
                : $communityGroup->state,
            'show_in_around_me' => array_key_exists('show_in_around_me', $validated)
                ? (bool) $validated['show_in_around_me']
                : $communityGroup->show_in_around_me,
        ])->save();

        return response()->json(['group' => $communityGroup->fresh()->toPayload()]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateGroup(Request $request, bool $partial = false, ?CommunityGroup $existing = null): array
    {
        $validated = $request->validate([
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'privacy' => [$partial ? 'sometimes' : 'required', 'string', Rule::in(GroupPrivacy::all())],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
            'show_in_around_me' => ['sometimes', 'boolean'],
        ]);

        $privacy = $validated['privacy'] ?? $existing?->privacy;
        $showInAroundMe = array_key_exists('show_in_around_me', $validated)
            ? (bool) $validated['show_in_around_me']
            : (bool) ($existing?->show_in_around_me ?? false);
        $address = array_key_exists('address', $validated)
            ? trim((string) ($validated['address'] ?? ''))
            : trim((string) ($existing?->address ?? ''));

        if ($showInAroundMe && $address === '') {
            throw ValidationException::withMessages([
                'address' => ['Enter a street address to show this group in Around Me recommendations.'],
            ]);
        }

        if ($showInAroundMe && $privacy === GroupPrivacy::PRIVATE) {
            throw ValidationException::withMessages([
                'privacy' => ['Around Me recommendations require a public group.'],
            ]);
        }

        $validated['show_in_around_me'] = $showInAroundMe;
        $validated['address'] = $showInAroundMe ? $address : null;

        return $validated;
    }

    private function authorizeOwner(Request $request, CommunityGroup $group): void
    {
        if ($group->owner_user_id !== $request->user()->id) {
            abort(403, 'You can only manage your own groups.');
        }
    }

    private function avatarLabel(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $initials .= strtoupper(substr($part, 0, 1));
        }

        return $initials !== '' ? $initials : 'G';
    }

    private function avatarColor(): string
    {
        $colors = ['#1B00D8', '#00669c', '#00734a', '#5b42f3', '#c45c26', '#3d9a8b'];

        return $colors[array_rand($colors)];
    }
}
