<?php

namespace App\Models;

use App\Support\AccountChannel;
use App\Support\BusinessListingStatus;
use App\Support\ProfileMode;
use App\Support\VerificationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'status',
        'bio',
        'phone',
        'avatar_path',
        'discoverable',
        'onboarding_completed_at',
        'phone_verified_at',
        'primary_login_channel',
        'is_admin',
        'user_verification_status',
        'user_verified_at',
        'profile_mode',
        'active_business_listing_id',
        'business_chat_name',
        'business_chat_website',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'user_verified_at' => 'datetime',
        'onboarding_completed_at' => 'datetime',
        'discoverable' => 'boolean',
        'is_admin' => 'boolean',
        'password' => 'hashed',
    ];

    public function ownedBusinessListings(): HasMany
    {
        return $this->hasMany(BusinessListing::class, 'owner_user_id');
    }

    public function submittedBusinessListings(): HasMany
    {
        return $this->hasMany(BusinessListing::class, 'submitted_by_user_id');
    }

    public function activeBusinessListing(): BelongsTo
    {
        return $this->belongsTo(BusinessListing::class, 'active_business_listing_id');
    }

    public function verificationSubmissions(): HasMany
    {
        return $this->hasMany(VerificationSubmission::class);
    }

    public function profileCards(): HasMany
    {
        return $this->hasMany(ProfileCard::class);
    }

    public function needsOnboarding(): bool
    {
        return $this->onboarding_completed_at === null;
    }

    public function isUserVerified(): bool
    {
        return $this->user_verification_status === VerificationStatus::VERIFIED;
    }

    public function isBusinessProfileMode(): bool
    {
        return $this->profile_mode === ProfileMode::BUSINESS;
    }

    public function chatDisplayName(): string
    {
        if ($this->isBusinessProfileMode()) {
            return $this->business_chat_name
                ?: $this->activeBusinessListing?->name
                ?: $this->publicDisplayName();
        }

        return $this->publicDisplayName();
    }

    public function effectiveVerificationStatus(): string
    {
        if ($this->isBusinessProfileMode() && $this->activeBusinessListing) {
            $businessStatus = $this->activeBusinessListing->verification_status;
            if ($businessStatus === VerificationStatus::VERIFIED) {
                return VerificationStatus::VERIFIED;
            }
        }

        return $this->user_verification_status;
    }

    public function loginLabel(): string
    {
        if ($this->primary_login_channel === AccountChannel::PHONE && $this->phone) {
            return $this->phone;
        }

        return $this->email ?? $this->phone ?? 'Gocha account';
    }

    public function publicDisplayName(): string
    {
        $name = trim((string) ($this->name ?? ''));

        return $name !== '' ? $name : 'Gocha user';
    }

    public function avatarUrl(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }

    public function toAuthPayload(): array
    {
        $activeListing = $this->relationLoaded('activeBusinessListing')
            ? $this->activeBusinessListing
            : $this->activeBusinessListing()->first();

        return [
            'id' => $this->id,
            'email' => $this->email,
            'phone' => $this->phone,
            'emailVerified' => $this->email_verified_at !== null,
            'phoneVerified' => $this->phone_verified_at !== null,
            'primaryLoginChannel' => $this->primary_login_channel,
            'displayName' => $this->publicDisplayName(),
            'username' => $this->username,
            'chatDisplayName' => $this->chatDisplayName(),
            'status' => $this->status,
            'bio' => $this->bio,
            'avatarUrl' => $this->avatarUrl(),
            'discoverable' => $this->discoverable,
            'needsOnboarding' => $this->needsOnboarding(),
            'isAdmin' => $this->is_admin,
            'userVerificationStatus' => $this->user_verification_status,
            'effectiveVerificationStatus' => $this->effectiveVerificationStatus(),
            'profileMode' => $this->profile_mode,
            'businessChatName' => $this->business_chat_name,
            'businessChatWebsite' => $this->business_chat_website,
            'activeBusinessListingId' => $this->active_business_listing_id,
            'activeBusinessListing' => $activeListing?->toSummaryPayload(),
        ];
    }

    public function toPublicProfilePayload(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'displayName' => $this->publicDisplayName(),
            'status' => $this->status,
            'bio' => $this->bio,
            'avatarUrl' => $this->avatarUrl(),
            'verificationStatus' => $this->effectiveVerificationStatus(),
            'profileMode' => $this->profile_mode,
            'website' => $this->isBusinessProfileMode() ? $this->business_chat_website : null,
            'chatUserId' => $this->id,
        ];
    }

    public function toAccountSwitcherPayload(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->loginLabel(),
            'displayName' => $this->publicDisplayName(),
            'avatarUrl' => $this->avatarUrl(),
            'primaryLoginChannel' => $this->primary_login_channel,
        ];
    }
}
