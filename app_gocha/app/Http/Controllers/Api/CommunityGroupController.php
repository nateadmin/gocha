<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityGroup;
use App\Support\GroupPrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommunityGroupController extends Controller
{
    public function discover(): JsonResponse
    {
        $groups = CommunityGroup::query()
            ->where('privacy', GroupPrivacy::PUBLIC)
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
            'avatar_label' => $this->avatarLabel($validated['name']),
            'avatar_color' => $this->avatarColor(),
            'member_count' => 1,
        ]);

        return response()->json(['group' => $group->toPayload()], 201);
    }

    public function update(Request $request, CommunityGroup $communityGroup): JsonResponse
    {
        $this->authorizeOwner($request, $communityGroup);

        $validated = $this->validateGroup($request, partial: true);

        $communityGroup->forceFill([
            'name' => $validated['name'] ?? $communityGroup->name,
            'description' => $validated['description'] ?? $communityGroup->description,
            'privacy' => $validated['privacy'] ?? $communityGroup->privacy,
            'address' => $validated['address'] ?? $communityGroup->address,
            'city' => $validated['city'] ?? $communityGroup->city,
            'state' => $validated['state'] ?? $communityGroup->state,
        ])->save();

        return response()->json(['group' => $communityGroup->fresh()->toPayload()]);
    }

    private function validateGroup(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'privacy' => [$partial ? 'sometimes' : 'required', 'string', Rule::in(GroupPrivacy::all())],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
        ]);
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
