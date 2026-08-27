<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessListing;
use App\Models\VerificationSubmission;
use App\Services\Verification\VerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    public function __construct(private readonly VerificationService $verifications) {}

    public function mine(Request $request): JsonResponse
    {
        $submissions = VerificationSubmission::query()
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereHas('businessListing', function ($listingQuery) use ($request) {
                        $listingQuery->where('owner_user_id', $request->user()->id);
                    });
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (VerificationSubmission $submission) => $submission->toPayload())
            ->values();

        return response()->json(['submissions' => $submissions]);
    }

    public function submitUserIdentity(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $path = $validated['document']->store('verification/user', 'public');
        $submission = $this->verifications->submitUserIdentity($request->user(), $path);

        return response()->json([
            'submission' => $submission->toPayload(),
            'message' => 'Identity document submitted for review.',
        ], 201);
    }

    public function submitBusinessListing(Request $request, BusinessListing $businessListing): JsonResponse
    {
        if ($businessListing->owner_user_id !== $request->user()->id) {
            return response()->json([
                'code' => 'FORBIDDEN',
                'message' => 'You can only verify your own business listings.',
            ], 403);
        }

        $validated = $request->validate([
            'document' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $path = $validated['document']->store('verification/business', 'public');
        $submission = $this->verifications->submitBusinessListing($businessListing, $path);

        return response()->json([
            'submission' => $submission->toPayload(),
            'message' => 'Business verification submitted for review.',
        ], 201);
    }
}
