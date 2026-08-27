<?php

namespace App\Services\Verification;

use App\Models\BusinessListing;
use App\Models\User;
use App\Models\VerificationSubmission;
use App\Support\VerificationStatus;

class VerificationService
{
    public function submitUserIdentity(User $user, string $documentPath): VerificationSubmission
    {
        return VerificationSubmission::query()->create([
            'user_id' => $user->id,
            'type' => 'user_identity',
            'document_path' => $documentPath,
            'status' => VerificationStatus::PENDING,
        ]);
    }

    public function submitBusinessListing(BusinessListing $listing, string $documentPath): VerificationSubmission
    {
        return VerificationSubmission::query()->create([
            'business_listing_id' => $listing->id,
            'type' => 'business_listing',
            'document_path' => $documentPath,
            'status' => VerificationStatus::PENDING,
        ]);
    }

    public function approve(VerificationSubmission $submission, User $admin): VerificationSubmission
    {
        $submission->forceFill([
            'status' => VerificationStatus::VERIFIED,
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $admin->id,
            'rejection_reason' => null,
        ])->save();

        if ($submission->type === 'user_identity' && $submission->user_id) {
            $submission->user?->forceFill([
                'user_verification_status' => VerificationStatus::VERIFIED,
                'user_verified_at' => now(),
            ])->save();
        }

        if ($submission->type === 'business_listing' && $submission->business_listing_id) {
            $listing = $submission->businessListing;
            if ($listing) {
                $listing->forceFill([
                    'verification_status' => VerificationStatus::VERIFIED,
                    'verified_at' => now(),
                ])->save();
            }
        }

        return $submission->fresh();
    }

    public function reject(VerificationSubmission $submission, User $admin, string $reason): VerificationSubmission
    {
        $submission->forceFill([
            'status' => VerificationStatus::REJECTED,
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $admin->id,
            'rejection_reason' => $reason,
        ])->save();

        if ($submission->type === 'user_identity' && $submission->user_id) {
            $submission->user?->forceFill([
                'user_verification_status' => VerificationStatus::REJECTED,
            ])->save();
        }

        if ($submission->type === 'business_listing' && $submission->business_listing_id) {
            $submission->businessListing?->forceFill([
                'verification_status' => VerificationStatus::REJECTED,
            ])->save();
        }

        return $submission->fresh();
    }
}
