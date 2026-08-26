<?php

namespace App\Services\Business;

use App\Models\BusinessListing;
use App\Models\User;
use App\Support\BusinessListingStatus;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BusinessListingService
{
    public function submit(User $user, array $data): BusinessListing
    {
        $slug = $this->uniqueSlug($data['name']);

        return BusinessListing::query()->create([
            'owner_user_id' => $user->id,
            'submitted_by_user_id' => $user->id,
            'slug' => $slug,
            'name' => $data['name'],
            'category' => $data['category'] ?? null,
            'description' => $data['description'] ?? null,
            'address' => $data['address'] ?? null,
            'website' => $data['website'] ?? null,
            'status' => BusinessListingStatus::PENDING_REVIEW,
            'submitted_at' => now(),
            'chat_enabled' => true,
        ]);
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
