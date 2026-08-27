<?php

namespace App\Services\Business;

use App\Models\BusinessListing;
use App\Models\User;
use App\Support\BusinessListingStatus;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BusinessListingService
{
    public function __construct(
        private readonly GoogleBusinessImportService $googleImport,
    ) {}

    public function create(User $user, array $data, bool $submit = true): BusinessListing
    {
        $slug = $this->uniqueSlug($data['name']);

        return BusinessListing::query()->create([
            'owner_user_id' => $user->id,
            'submitted_by_user_id' => $user->id,
            'slug' => $slug,
            'name' => $data['name'],
            'category' => $data['category'] ?? null,
            'description' => $data['description'] ?? null,
            'address' => ($data['no_physical_address'] ?? false) ? null : ($data['address'] ?? null),
            'no_physical_address' => (bool) ($data['no_physical_address'] ?? false),
            'website' => $data['website'] ?? null,
            'google_business_url' => $data['google_business_url'] ?? null,
            'google_place_id' => $data['google_place_id'] ?? null,
            'status' => $submit ? BusinessListingStatus::PENDING_REVIEW : BusinessListingStatus::DRAFT,
            'submitted_at' => $submit ? now() : null,
            'chat_enabled' => true,
        ]);
    }

    public function update(BusinessListing $listing, array $data): BusinessListing
    {
        if (! $this->canEdit($listing)) {
            throw ValidationException::withMessages([
                'listing' => ['This listing cannot be edited while it is under review.'],
            ]);
        }

        $listing->forceFill([
            'name' => $data['name'] ?? $listing->name,
            'category' => $data['category'] ?? $listing->category,
            'description' => $data['description'] ?? $listing->description,
            'no_physical_address' => (bool) ($data['no_physical_address'] ?? $listing->no_physical_address),
            'address' => ($data['no_physical_address'] ?? $listing->no_physical_address)
                ? null
                : ($data['address'] ?? $listing->address),
            'website' => $data['website'] ?? $listing->website,
            'google_business_url' => $data['google_business_url'] ?? $listing->google_business_url,
            'google_place_id' => $data['google_place_id'] ?? $listing->google_place_id,
        ])->save();

        return $listing->fresh();
    }

    public function saveDraft(BusinessListing $listing, array $data): BusinessListing
    {
        $listing = $this->update($listing, $data);

        if ($listing->status !== BusinessListingStatus::PENDING_REVIEW) {
            $listing->forceFill([
                'status' => BusinessListingStatus::DRAFT,
                'submitted_at' => null,
                'rejection_reason' => null,
            ])->save();
        }

        return $listing->fresh();
    }

    public function submitForReview(BusinessListing $listing): BusinessListing
    {
        if ($listing->status === BusinessListingStatus::PENDING_REVIEW) {
            throw ValidationException::withMessages([
                'listing' => ['This listing is already pending review.'],
            ]);
        }

        if ($listing->status === BusinessListingStatus::APPROVED) {
            throw ValidationException::withMessages([
                'listing' => ['Approved listings are already live. Unpublish first to edit.'],
            ]);
        }

        $listing->forceFill([
            'status' => BusinessListingStatus::PENDING_REVIEW,
            'submitted_at' => now(),
            'rejection_reason' => null,
        ])->save();

        return $listing->fresh();
    }

    public function unpublish(BusinessListing $listing): BusinessListing
    {
        if ($listing->status !== BusinessListingStatus::APPROVED) {
            throw ValidationException::withMessages([
                'listing' => ['Only live listings can be unpublished.'],
            ]);
        }

        $listing->forceFill([
            'status' => BusinessListingStatus::UNPUBLISHED,
        ])->save();

        return $listing->fresh();
    }

    public function delete(BusinessListing $listing): void
    {
        if ($listing->cover_photo_path) {
            Storage::disk('public')->delete($listing->cover_photo_path);
        }

        $listing->delete();
    }

    public function storeCoverPhoto(BusinessListing $listing, string $contents, string $extension): BusinessListing
    {
        if (! $this->canEdit($listing)) {
            throw ValidationException::withMessages([
                'cover' => ['Cover photo cannot be changed while the listing is under review.'],
            ]);
        }

        if ($listing->cover_photo_path) {
            Storage::disk('public')->delete($listing->cover_photo_path);
        }

        $path = 'business-covers/'.$listing->id.'-'.Str::random(8).'.'.$extension;
        Storage::disk('public')->put($path, $contents);

        $listing->forceFill(['cover_photo_path' => $path])->save();

        return $listing->fresh();
    }

    /**
     * @return array{reviews: array<int, array<string, mixed>>, syncedAt: string|null, message?: string}
     */
    public function syncGoogleReviews(BusinessListing $listing): array
    {
        $placeId = $listing->google_place_id;

        if (! $placeId && $listing->google_business_url) {
            $imported = $this->googleImport->importFromUrl($listing->google_business_url);
            $placeId = $imported['googlePlaceId'] ?? null;
            if ($placeId) {
                $listing->forceFill([
                    'google_place_id' => $placeId,
                    'google_business_url' => $imported['googleBusinessUrl'],
                ])->save();
            }
        }

        if (! $placeId) {
            throw ValidationException::withMessages([
                'google' => ['Add a Google Business link so Gocha can pull reviews.'],
            ]);
        }

        $apiKey = config('gocha.google_places_api_key');
        if (! $apiKey) {
            throw ValidationException::withMessages([
                'google' => ['Google Places API is not configured on the server yet.'],
            ]);
        }

        $reviews = $this->googleImport->fetchReviews($placeId, $apiKey);
        $listing->forceFill([
            'google_reviews' => $reviews,
            'google_reviews_synced_at' => now(),
        ])->save();

        return [
            'reviews' => $reviews,
            'syncedAt' => $listing->google_reviews_synced_at?->toIso8601String(),
        ];
    }

    public function submit(User $user, array $data): BusinessListing
    {
        return $this->create($user, $data, true);
    }

    public function approve(BusinessListing $listing, User $admin): BusinessListing
    {
        $listing->forceFill([
            'status' => BusinessListingStatus::APPROVED,
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $admin->id,
            'rejection_reason' => null,
        ])->save();

        return $listing->fresh();
    }

    public function reject(BusinessListing $listing, User $admin, string $reason): BusinessListing
    {
        $listing->forceFill([
            'status' => BusinessListingStatus::REJECTED,
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $admin->id,
            'rejection_reason' => $reason,
        ])->save();

        return $listing->fresh();
    }

    public function attachContactEmail(User $user, string $email): void
    {
        $email = Str::lower(trim($email));

        if ($user->email === $email) {
            return;
        }

        if (User::query()->where('email', $email)->where('id', '!=', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['That email is already linked to another account.'],
            ]);
        }

        $user->forceFill([
            'email' => $email,
            'email_verified_at' => null,
        ])->save();
    }

    public function attachContactPhone(User $user, string $phone): void
    {
        $normalized = preg_replace('/\D+/', '', $phone) ?? '';
        $e164 = '+'.$normalized;

        if ($user->phone === $e164) {
            return;
        }

        if (User::query()->where('phone', $e164)->where('id', '!=', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['That phone number is already linked to another account.'],
            ]);
        }

        $user->forceFill([
            'phone' => $e164,
            'phone_verified_at' => null,
        ])->save();
    }

    private function canEdit(BusinessListing $listing): bool
    {
        return $listing->status !== BusinessListingStatus::PENDING_REVIEW
            && $listing->status !== BusinessListingStatus::APPROVED;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'business';
        }

        $slug = $base;
        $suffix = 1;

        while (BusinessListing::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
