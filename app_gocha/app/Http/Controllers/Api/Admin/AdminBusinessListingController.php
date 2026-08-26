<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessListing;
use App\Models\VerificationSubmission;
use App\Services\Business\BusinessListingService;
use App\Services\Verification\VerificationService;
use App\Support\BusinessListingStatus;
use App\Support\VerificationStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBusinessListingController extends Controller
{
    public function __construct(private readonly BusinessListingService $businesses) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', BusinessListingStatus::PENDING_REVIEW);

        $listings = BusinessListing::query()
            ->where('status', $status)
            ->orderBy('submitted_at')
            ->get()
            ->map(fn (BusinessListing $listing) => $listing->toOwnerPayload())
            ->values();

        return response()->json(['listings' => $listings]);
    }

    public function approve(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $listing = $this->businesses->approve($businessListing, $request->user());

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => 'Business listing approved.',
        ]);
    }

    public function reject(Request $request, BusinessListing $businessListing): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $listing = $this->businesses->reject(
            $businessListing,
            $request->user(),
            $validated['reason'],
        );

        return response()->json([
            'listing' => $listing->toOwnerPayload(),
            'message' => 'Business listing rejected.',
        ]);
    }
}
