<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\VerificationSubmission;
use App\Services\Verification\VerificationService;
use App\Support\VerificationStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminVerificationController extends Controller
{
    public function __construct(private readonly VerificationService $verifications) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', VerificationStatus::PENDING);

        $submissions = VerificationSubmission::query()
            ->where('status', $status)
            ->orderBy('created_at')
            ->get()
            ->map(fn (VerificationSubmission $submission) => $submission->toPayload())
            ->values();

        return response()->json(['submissions' => $submissions]);
    }

    public function approve(Request $request, VerificationSubmission $verificationSubmission): JsonResponse
    {
        $submission = $this->verifications->approve($verificationSubmission, $request->user());

        return response()->json([
            'submission' => $submission->toPayload(),
            'message' => 'Verification approved.',
        ]);
    }

    public function reject(Request $request, VerificationSubmission $verificationSubmission): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $submission = $this->verifications->reject(
            $verificationSubmission,
            $request->user(),
            $validated['reason'],
        );

        return response()->json([
            'submission' => $submission->toPayload(),
            'message' => 'Verification rejected.',
        ]);
    }
}
