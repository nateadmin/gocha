<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessListing;
use App\Services\Business\BusinessListingService;
use App\Services\Business\GoogleBusinessImportService;
use App\Support\BusinessListingStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BusinessListingController extends Controller
{
    public function __construct(
        private readonly BusinessListingService $businesses,
        private readonly GoogleBusinessImportService $googleImport,
    ) {}

    public function index(): JsonResponse
    {
        $listings = BusinessListing::query()
            ->where('status', BusinessListingStatus::APPROVED)
            ->orderBy('name')
            ->get()
            ->map(fn (BusinessListing $listing) => $listing->toPublicPayload())
            ->values();

        return response()->json(['listings' => $listings]);
    }

    public function industries(): JsonResponse
    {
        $labels = config('business.industry_labels', []);
        $industries = collect(config('business.industries', []))
            ->map(fn (string $id) => [
                'id' => $id,
                'label' => $labels[$id] ?? $id,
            ])
            ->values();

        return response()->json(['industries' => $industries]);
    }

    public function show(string $slug): JsonResponse
    {
        $listing = BusinessListing::query()
            ->where('slug', $slug)
            ->where('status', BusinessListingStatus::APPROVED)
            ->firstOrFail();

        return response()->json(['listing' => $listing->toPublicPayload()]);
    }

    public function mine(Request $request): JsonResponse
    {
        $listings = BusinessListing::query()
            ->where('owner_user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (BusinessListing $listing) => $listing->toOwnerPayload())
            ->values();

        return response()->json(['listings' => $listings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateListingInput($request);
        $submit = (bool) ($validated['submit'] ?? true);

        $listing = $this->businesses->create($request->user(), $validated, $submit);

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => $submit
                ? 'Business listing submitted for review.'
                : 'Draft saved.',
        ], 201);
    }

    public function update(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $validated = $this->validateListingInput($request, partial: true);
        $listing = $this->businesses->update($businessListing, $validated);

        return response()->json(['listing' => $listing->toOwnerPayload()]);
    }

    public function saveDraft(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $validated = $this->validateListingInput($request, partial: true);
        $listing = $this->businesses->saveDraft($businessListing, $validated);

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => 'Draft saved.',
        ]);
    }

    public function submit(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $listing = $this->businesses->submitForReview($businessListing);

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => 'Submitted for review.',
        ]);
    }

    public function unpublish(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $listing = $this->businesses->unpublish($businessListing);

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => 'Listing unpublished.',
        ]);
    }

    public function destroy(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $this->businesses->delete($businessListing);

        return response()->json(['message' => 'Listing deleted.']);
    }

    public function uploadCover(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $validated = $request->validate([
            'cover' => ['required', 'file', 'image', 'max:4096'],
        ]);

        $file = $validated['cover'];
        $extension = strtolower($file->extension() ?: 'jpg');
        $listing = $this->businesses->storeCoverPhoto(
            $businessListing,
            $file->getContent(),
            $extension,
        );

        return response()->json(['listing' => $listing->toOwnerPayload()]);
    }

    public function importGoogle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'string', 'max:512', 'url'],
        ]);

        $imported = $this->googleImport->importFromUrl($validated['url']);

        return response()->json(['import' => $imported]);
    }

    public function syncReviews(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $this->authorizeOwner($request, $businessListing);

        $result = $this->businesses->syncGoogleReviews($businessListing);

        return response()->json([
            'listing' => $businessListing->fresh()->toOwnerPayload(),
            'reviews' => $result['reviews'],
            'syncedAt' => $result['syncedAt'],
        ]);
    }

    private function validateListingInput(Request $request, bool $partial = false): array
    {
        $industries = config('business.industries', []);

        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:80', Rule::in($industries)],
            'description' => ['nullable', 'string', 'max:2000'],
            'address' => ['nullable', 'string', 'max:255'],
            'no_physical_address' => ['nullable', 'boolean'],
            'website' => ['nullable', 'string', 'max:255', 'url'],
            'google_business_url' => ['nullable', 'string', 'max:512', 'url'],
            'google_place_id' => ['nullable', 'string', 'max:128'],
            'submit' => ['nullable', 'boolean'],
        ];

        return $request->validate($rules);
    }

    private function authorizeOwner(Request $request, BusinessListing $listing): void
    {
        if ($listing->owner_user_id !== $request->user()->id) {
            abort(403, 'You can only manage your own business listings.');
        }
    }
}
