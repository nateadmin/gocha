<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class VerificationSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'business_listing_id',
        'type',
        'document_path',
        'status',
        'reviewed_by_user_id',
        'reviewed_at',
        'rejection_reason',
        'notes',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function businessListing(): BelongsTo
    {
        return $this->belongsTo(BusinessListing::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'status' => $this->status,
            'businessListingId' => $this->business_listing_id,
            'documentUrl' => Storage::disk('public')->url($this->document_path),
            'reviewedAt' => $this->reviewed_at?->toIso8601String(),
            'rejectionReason' => $this->rejection_reason,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
