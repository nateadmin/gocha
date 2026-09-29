<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityGroup;
use App\Models\CommunityGroupMembership;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use App\Services\Groups\CommunityGroupJoinService;
use App\Support\CommunityGroupMembershipStatus;
use App\Support\ConversationType;
use App\Support\GroupPrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CommunityGroupController extends Controller
{
    public function __construct(
        private readonly CommunityGroupJoinService $joins,
    ) {}

    public function discover(Request $request): JsonResponse
    {
        $groups = CommunityGroup::query()
            ->where('privacy', GroupPrivacy::PUBLIC)
            ->where('show_in_around_me', true)
            ->orderByDesc('member_count')
            ->get()
            ->filter(fn (CommunityGroup $group) => $group->isDiscoverableInAroundMe())
            ->values();

        return response()->json([
            'groups' => $this->decorateGroups($groups, $this->optionalUser($request)),
        ]);
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
            ->get();

        return response()->json([
            'groups' => $this->decorateGroups($groups, $this->optionalUser($request)),
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $groups = CommunityGroup::query()
            ->where('owner_user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'groups' => $this->decorateGroups($groups, $request->user()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateGroup($request);
        $user = $request->user();
        $conversationId = $this->authorizedConversationId($request, $user);

        $group = CommunityGroup::query()->create([
            'owner_user_id' => $user->id,
            'conversation_id' => $conversationId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'privacy' => $validated['privacy'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'google_place_id' => $validated['google_place_id'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'show_in_around_me' => (bool) ($validated['show_in_around_me'] ?? false),
            'avatar_label' => $this->avatarLabel($validated['name']),
            'avatar_color' => $this->avatarColor(),
            'member_count' => 1,
        ]);

        $this->joins->addOwnerMembership($group, $user);
        $this->joins->syncConversationMembers($group);

        return response()->json([
            'group' => $this->decorateGroup($group->fresh(), $user),
        ], 201);
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
            'google_place_id' => array_key_exists('google_place_id', $validated)
                ? $validated['google_place_id']
                : $communityGroup->google_place_id,
            'latitude' => array_key_exists('latitude', $validated)
                ? $validated['latitude']
                : $communityGroup->latitude,
            'longitude' => array_key_exists('longitude', $validated)
                ? $validated['longitude']
                : $communityGroup->longitude,
            'show_in_around_me' => array_key_exists('show_in_around_me', $validated)
                ? (bool) $validated['show_in_around_me']
                : $communityGroup->show_in_around_me,
        ])->save();

        return response()->json([
            'group' => $this->decorateGroup($communityGroup->fresh(), $request->user()),
        ]);
    }

    public function requestJoin(Request $request, CommunityGroup $communityGroup): JsonResponse
    {
        $membership = $this->joins->requestJoin($communityGroup, $request->user());

        return response()->json([
            'request' => $membership->toPayload(),
            'group' => $this->decorateGroup($communityGroup->fresh(), $request->user()),
        ], 201);
    }

    public function joinRequests(Request $request, CommunityGroup $communityGroup): JsonResponse
    {
        $requests = $this->joins->pendingForGroup($communityGroup, $request->user())
            ->map(fn (CommunityGroupMembership $membership) => $membership->toPayload())
            ->values();

        return response()->json(['requests' => $requests]);
    }

    public function approveJoin(
        Request $request,
        CommunityGroup $communityGroup,
        CommunityGroupMembership $membership,
    ): JsonResponse {
        $this->assertMembershipBelongsToGroup($communityGroup, $membership);
        $approved = $this->joins->approve($membership, $request->user());

        return response()->json([
            'request' => $approved->toPayload(),
            'group' => $this->decorateGroup($communityGroup->fresh(), $request->user()),
        ]);
    }

    public function declineJoin(
        Request $request,
        CommunityGroup $communityGroup,
        CommunityGroupMembership $membership,
    ): JsonResponse {
        $this->assertMembershipBelongsToGroup($communityGroup, $membership);
        $declined = $this->joins->decline($membership, $request->user());

        return response()->json([
            'request' => $declined->toPayload(),
            'group' => $this->decorateGroup($communityGroup->fresh(), $request->user()),
        ]);
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
            'google_place_id' => ['nullable', 'string', 'max:128'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'show_in_around_me' => ['sometimes', 'boolean'],
            'conversation_id' => ['sometimes', 'nullable', 'integer', 'exists:conversations,id'],
        ]);

        $privacy = $validated['privacy'] ?? $existing?->privacy;
        $showInAroundMe = array_key_exists('show_in_around_me', $validated)
            ? (bool) $validated['show_in_around_me']
            : (bool) ($existing?->show_in_around_me ?? false);
        $address = array_key_exists('address', $validated)
            ? trim((string) ($validated['address'] ?? ''))
            : trim((string) ($existing?->address ?? ''));
        $placeId = array_key_exists('google_place_id', $validated)
            ? trim((string) ($validated['google_place_id'] ?? ''))
            : trim((string) ($existing?->google_place_id ?? ''));

        if ($showInAroundMe && $address === '') {
            throw ValidationException::withMessages([
                'address' => ['Select a Google address to show this group in Around Me recommendations.'],
            ]);
        }

        if ($showInAroundMe && $placeId === '') {
            throw ValidationException::withMessages([
                'google_place_id' => ['Select a suggested address from Google.'],
            ]);
        }

        if ($showInAroundMe && $privacy === GroupPrivacy::PRIVATE) {
            throw ValidationException::withMessages([
                'privacy' => ['Around Me recommendations require a public group.'],
            ]);
        }

        $validated['show_in_around_me'] = $showInAroundMe;
        $validated['address'] = $showInAroundMe ? $address : null;
        $validated['google_place_id'] = $showInAroundMe ? $placeId : null;
        if (! $showInAroundMe) {
            $validated['city'] = $validated['city'] ?? null;
            $validated['state'] = $validated['state'] ?? null;
            $validated['latitude'] = null;
            $validated['longitude'] = null;
        }

        return $validated;
    }

    private function authorizedConversationId(Request $request, User $user): ?int
    {
        $conversationId = $request->integer('conversation_id');
        if ($conversationId <= 0) {
            return null;
        }

        $conversation = Conversation::query()->find($conversationId);
        if (! $conversation || $conversation->type !== ConversationType::GROUP) {
            throw ValidationException::withMessages([
                'conversation_id' => ['Link a group chat you belong to.'],
            ]);
        }

        $isParticipant = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->exists();
        if (! $isParticipant) {
            throw ValidationException::withMessages([
                'conversation_id' => ['You can only link a group chat you belong to.'],
            ]);
        }

        return $conversation->id;
    }

    private function authorizeOwner(Request $request, CommunityGroup $group): void
    {
        if ($group->owner_user_id !== $request->user()->id) {
            abort(403, 'You can only manage your own groups.');
        }
    }

    private function assertMembershipBelongsToGroup(
        CommunityGroup $group,
        CommunityGroupMembership $membership,
    ): void {
        if ((int) $membership->community_group_id !== (int) $group->id) {
            abort(404);
        }
    }

    private function optionalUser(Request $request): ?User
    {
        return $request->user() ?? $request->user('sanctum');
    }

    /**
     * @param  Collection<int, CommunityGroup>  $groups
     * @return list<array<string, mixed>>
     */
    private function decorateGroups(Collection $groups, ?User $viewer): array
    {
        if ($groups->isEmpty()) {
            return [];
        }

        $memberships = collect();
        $pendingByGroup = collect();
        if ($viewer) {
            $ids = $groups->pluck('id');
            $memberships = CommunityGroupMembership::query()
                ->whereIn('community_group_id', $ids)
                ->where('user_id', $viewer->id)
                ->get()
                ->keyBy('community_group_id');
            $ownedIds = $groups
                ->filter(fn (CommunityGroup $group) => (int) $group->owner_user_id === (int) $viewer->id)
                ->pluck('id');
            if ($ownedIds->isNotEmpty()) {
                $pendingByGroup = CommunityGroupMembership::query()
                    ->whereIn('community_group_id', $ownedIds)
                    ->where('status', CommunityGroupMembershipStatus::PENDING)
                    ->with('user')
                    ->orderByDesc('requested_at')
                    ->get()
                    ->groupBy('community_group_id');
            }
        }

        return $groups
            ->map(function (CommunityGroup $group) use ($viewer, $memberships, $pendingByGroup) {
                return $this->decorateGroup(
                    $group,
                    $viewer,
                    $memberships->get($group->id),
                    $pendingByGroup->get($group->id) ?? collect(),
                );
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, CommunityGroupMembership>|null  $pending
     * @return array<string, mixed>
     */
    private function decorateGroup(
        CommunityGroup $group,
        ?User $viewer,
        ?CommunityGroupMembership $membership = null,
        ?Collection $pending = null,
    ): array {
        if ($viewer && $membership === null) {
            $membership = CommunityGroupMembership::query()
                ->where('community_group_id', $group->id)
                ->where('user_id', $viewer->id)
                ->first();
        }

        $pendingRequests = $pending;
        if ($pendingRequests === null && $viewer && (int) $group->owner_user_id === (int) $viewer->id) {
            $pendingRequests = CommunityGroupMembership::query()
                ->where('community_group_id', $group->id)
                ->where('status', CommunityGroupMembershipStatus::PENDING)
                ->with('user')
                ->orderByDesc('requested_at')
                ->get();
        }

        $payload = $group->toPayload();
        $payload['membershipStatus'] = $this->joins->membershipStatus($group, $viewer, $membership);
        $payload['pendingRequestCount'] = $pendingRequests?->count() ?? 0;
        $payload['pendingRequests'] = $pendingRequests
            ? $pendingRequests->map(fn (CommunityGroupMembership $row) => $row->toPayload())->values()->all()
            : [];

        return $payload;
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
