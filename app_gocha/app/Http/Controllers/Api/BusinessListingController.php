<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessListing;
use App\Services\Business\BusinessListingService;
use App\Support\BusinessListingStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessListingController extends Controller
{
    public function __construct(private readonly BusinessListingService $businesses) {}

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
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (BusinessListing $listing) => $listing->toOwnerPayload())
            ->values();

        return response()->json(['listings' => $listings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:2000'],
            'address' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255', 'url'],
        ]);

        $listing = $this->businesses->submit($request->user(), $validated);

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => 'Business listing submitted for review.',
        ], 201);
    }
}
