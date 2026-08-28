<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfileCard;
use App\Models\ProfileCardAccess;
use App\Models\User;
use App\Services\Profile\ProfileCardService;
use App\Support\ProfileCardAccessStatus;
use App\Support\ProfileCardType;
use App\Support\ProfileCardVisibility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileCardController extends Controller
{
    public function __construct(private readonly ProfileCardService $cards) {}

    public function index(Request $request): JsonResponse
    {
        $cards = $this->cards->cardsForOwner($request->user())
            ->map(fn (ProfileCard $card) => $card->toOwnerPayload())
            ->values();

        return response()->json(['cards' => $cards]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedCard($request, creating: true);
        $card = $this->cards->create($request->user(), $validated);

        return response()->json(['card' => $card->toOwnerPayload()], 201);
    }

    public function showPublic(Request $request, string $slug): JsonResponse
    {
        $card = $this->cards->findBySlug($slug);

        return response()->json(['card' => $card->toPublicPagePayload($request->user())]);
    }

    public function show(Request $request, ProfileCard $profileCard): JsonResponse
    {
        $this->cards->assertCanViewDetail($profileCard, $request->user());

        return response()->json(['card' => $profileCard->toDetailPayload($request->user())]);
    }

    public function update(Request $request, ProfileCard $profileCard): JsonResponse
    {
        $this->cards->assertOwner($profileCard, $request->user());
        $validated = $this->validatedCard($request, creating: false);
        $card = $this->cards->update($profileCard, $validated);

        return response()->json(['card' => $card->toOwnerPayload()]);
    }

    public function destroy(Request $request, ProfileCard $profileCard): JsonResponse
    {
        $this->cards->assertOwner($profileCard, $request->user());
        $this->cards->delete($profileCard);

        return response()->json(['ok' => true]);
    }

    public function uploadPhoto(Request $request, ProfileCard $profileCard): JsonResponse
    {
        $this->cards->assertOwner($profileCard, $request->user());

        $request->validate([
            'photo' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $path = $request->file('photo')->store('profile-cards', 'public');
        $profileCard->forceFill(['photo_path' => $path])->save();

        return response()->json([
            'card' => $profileCard->fresh(['owner', 'accesses'])->toOwnerPayload(),
        ]);
    }

    public function listedForUser(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        $cards = $this->cards->cardsListedForViewer($user, $viewer)
            ->map(fn (ProfileCard $card) => $card->toSummaryPayload($viewer))
            ->values();

        return response()->json([
            'owner' => [
                'id' => $user->id,
                'displayName' => $user->publicDisplayName(),
                'username' => $user->username,
                'avatarUrl' => $user->avatarUrl(),
            ],
            'cards' => $cards,
        ]);
    }

    public function requestAccess(Request $request, ProfileCard $profileCard): JsonResponse
    {
        $access = $this->cards->requestAccess($profileCard, $request->user());

        return response()->json([
            'access' => $this->accessPayload($access),
            'card' => $profileCard->fresh(['owner', 'accesses' => fn ($query) => $query->where('viewer_user_id', $request->user()->id)])
                ->toSummaryPayload($request->user()),
        ], $access->wasRecentlyCreated ? 201 : 200);
    }

    public function grant(Request $request, ProfileCard $profileCard): JsonResponse
    {
        $this->cards->assertOwner($profileCard, $request->user());

        $validated = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $viewer = User::query()->findOrFail($validated['userId']);
        $access = $this->cards->grant($profileCard, $viewer);

        return response()->json(['access' => $this->accessPayload($access)]);
    }

    public function incomingRequests(Request $request): JsonResponse
    {
        $requests = $this->cards->pendingRequestsFor($request->user())
            ->map(fn (ProfileCardAccess $access) => $this->accessPayload($access))
            ->values();

        return response()->json(['requests' => $requests]);
    }

    public function approve(Request $request, ProfileCardAccess $profileCardAccess): JsonResponse
    {
        $access = $this->cards->decide(
            $profileCardAccess,
            $request->user(),
            ProfileCardAccessStatus::APPROVED,
        );

        return response()->json(['access' => $this->accessPayload($access)]);
    }

    public function decline(Request $request, ProfileCardAccess $profileCardAccess): JsonResponse
    {
        $access = $this->cards->decide(
            $profileCardAccess,
            $request->user(),
            ProfileCardAccessStatus::DECLINED,
        );

        return response()->json(['access' => $this->accessPayload($access)]);
    }

    /** @return array<string, mixed> */
    private function validatedCard(Request $request, bool $creating): array
    {
        $rules = [
            'type' => [$creating ? 'required' : 'sometimes', 'string', Rule::in(ProfileCardType::all())],
            'title' => ['sometimes', 'nullable', 'string', 'max:80'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:48'],
            'headline' => ['sometimes', 'nullable', 'string', 'max:160'],
            'visibility' => [$creating ? 'sometimes' : 'sometimes', 'string', Rule::in(ProfileCardVisibility::all())],
            'body' => ['sometimes', 'array'],
            'body.company' => ['sometimes', 'nullable', 'string', 'max:120'],
            'body.role' => ['sometimes', 'nullable', 'string', 'max:120'],
            'body.location' => ['sometimes', 'nullable', 'string', 'max:120'],
            'body.about' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'body.skills' => ['sometimes', 'nullable', 'string', 'max:500'],
            'body.website' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body.lookingFor' => ['sometimes', 'nullable', 'string', 'max:160'],
            'body.interests' => ['sometimes', 'nullable', 'string', 'max:500'],
            'body.details' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];

        return $request->validate($rules);
    }

    /** @return array<string, mixed> */
    private function accessPayload(ProfileCardAccess $access): array
    {
        $viewer = $access->relationLoaded('viewer') ? $access->viewer : $access->viewer()->first();
        $card = $access->relationLoaded('card') ? $access->card : $access->card()->first();

        return [
            'id' => $access->id,
            'status' => $access->status,
            'requestedAt' => $access->requested_at?->toIso8601String(),
            'decidedAt' => $access->decided_at?->toIso8601String(),
            'cardId' => $access->profile_card_id,
            'cardTitle' => $card?->title,
            'cardType' => $card?->type,
            'viewer' => $viewer ? [
                'id' => $viewer->id,
                'displayName' => $viewer->publicDisplayName(),
                'username' => $viewer->username,
                'avatarUrl' => $viewer->avatarUrl(),
            ] : null,
        ];
    }
}
