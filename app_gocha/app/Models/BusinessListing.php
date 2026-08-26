<?php

namespace App\Models;

use App\Support\BusinessListingStatus;
use App\Support\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessListing extends Model
{
    protected $fillable = [
        'owner_user_id',
        'submitted_by_user_id',
        'slug',
        'name',
        'category',
        'description',
        'address',
        'website',
        'status',
        'verification_status',
        'verified_at',
        'submitted_at',
        'reviewed_at',
        'reviewed_by_user_id',
        'rejection_reason',
        'chat_enabled',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'chat_enabled' => 'boolean',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function verificationSubmissions(): HasMany
    {
        return $this->hasMany(VerificationSubmission::class);
    }

    public function isApproved(): bool
    {
        return $this->status === BusinessListingStatus::APPROVED;
    }

    public function isVerified(): bool
    {
        return $this->verification_status === VerificationStatus::VERIFIED;
    }

    public function chatUserId(): int
    {
        return $this->owner_user_id;
    }

    public function toSummaryPayload(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'status' => $this->status,
            'verificationStatus' => $this->verification_status,
            'isVerified' => $this->isVerified(),
            'chatEnabled' => $this->chat_enabled,
            'chatUserId' => $this->chatUserId(),
        ];
    }

    public function toPublicPayload(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'description' => $this->description,
            'address' => $this->address,
            'website' => $this->website,
            'verificationStatus' => $this->verification_status,
            'isVerified' => $this->isVerified(),
            'chatEnabled' => $this->chat_enabled,
            'chatUserId' => $this->chatUserId(),
            'ownerUserId' => $this->owner_user_id,
        ];
    }

    public function toOwnerPayload(): array
    {
        return array_merge($this->toPublicPayload(), [
            'status' => $this->status,
            'submittedAt' => $this->submitted_at?->toIso8601String(),
            'reviewedAt' => $this->reviewed_at?->toIso8601String(),
            'rejectionReason' => $this->rejection_reason,
        ]);
    }
}
