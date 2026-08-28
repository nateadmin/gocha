<?php

namespace App\Models;

use App\Support\ProfileCardAccessStatus;
use App\Support\ProfileCardType;
use App\Support\ProfileCardVisibility;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class ProfileCard extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'slug',
        'headline',
        'photo_path',
        'visibility',
        'body',
    ];

    protected $casts = [
        'body' => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function accesses(): HasMany
    {
        return $this->hasMany(ProfileCardAccess::class);
    }

    public function photoUrl(): ?string
    {
        if (! $this->photo_path) {
            return null;
        }

        return Storage::disk('public')->url($this->photo_path);
    }

    public function isPublic(): bool
    {
        return $this->visibility === ProfileCardVisibility::PUBLIC;
    }

    public function isRequestOnly(): bool
    {
        return $this->visibility === ProfileCardVisibility::REQUEST;
    }

    public function isPrivate(): bool
    {
        return $this->visibility === ProfileCardVisibility::PRIVATE;
    }

    public function accessFor(User $viewer): ?ProfileCardAccess
    {
        if ($this->relationLoaded('accesses')) {
            return $this->accesses->firstWhere('viewer_user_id', $viewer->id);
        }

        return $this->accesses()->where('viewer_user_id', $viewer->id)->first();
    }

    public function viewerCanSeeDetail(User $viewer): bool
    {
        if ($this->user_id === $viewer->id) {
            return true;
        }

        if ($this->isPublic()) {
            return true;
        }

        return $this->accessFor($viewer)?->status === ProfileCardAccessStatus::APPROVED;
    }

    public function listedForViewer(User $viewer): bool
    {
        if ($this->user_id === $viewer->id) {
            return true;
        }

        if ($this->isPublic() || $this->isRequestOnly()) {
            return true;
        }

        return $this->accessFor($viewer)?->status === ProfileCardAccessStatus::APPROVED;
    }

    /** @return array<string, mixed> */
    public function toOwnerPayload(): array
    {
        return [
            ...$this->toSummaryPayload($this->owner),
            'headline' => $this->headline,
            'photoUrl' => $this->photoUrl(),
            'body' => $this->normalizedBody(),
            'pendingRequestCount' => $this->relationLoaded('accesses')
                ? $this->accesses->where('status', ProfileCardAccessStatus::PENDING)->count()
                : $this->accesses()->where('status', ProfileCardAccessStatus::PENDING)->count(),
        ];
    }

    /** @return array<string, mixed> */
    public function toSummaryPayload(User $viewer): array
    {
        $access = $this->user_id === $viewer->id ? null : $this->accessFor($viewer);
        $canView = $this->viewerCanSeeDetail($viewer);

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'slug' => $this->slug,
            'visibility' => $this->visibility,
            'canView' => $canView,
            'accessStatus' => $access?->status,
            'photoUrl' => $canView ? $this->photoUrl() : null,
            'headline' => $canView ? $this->headline : null,
        ];
    }

    /** @return array<string, mixed> */
    public function toDetailPayload(User $viewer): array
    {
        return [
            ...$this->toSummaryPayload($viewer),
            'headline' => $this->headline,
            'photoUrl' => $this->photoUrl(),
            'body' => $this->normalizedBody(),
            'owner' => [
                'id' => $this->owner->id,
                'displayName' => $this->owner->publicDisplayName(),
                'username' => $this->owner->username,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function toPublicPagePayload(?User $viewer): array
    {
        $this->loadMissing('owner');
        $ownerId = (int) $this->user_id;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'slug' => $this->slug,
            'headline' => $this->headline,
            'photoUrl' => $this->photoUrl(),
            'body' => $this->normalizedBody(),
            'owner' => [
                'id' => $ownerId,
                'displayName' => $this->owner?->publicDisplayName() ?? 'Gocha',
                'username' => $this->owner?->username,
                'avatarUrl' => $this->owner?->avatarUrl(),
            ],
            'viewerIsOwner' => $viewer !== null && (int) $viewer->id === $ownerId,
        ];
    }

    /** @return array<string, mixed> */
    public function normalizedBody(): array
    {
        $body = is_array($this->body) ? $this->body : [];

        return match ($this->type) {
            ProfileCardType::PROFESSIONAL => [
                'company' => (string) ($body['company'] ?? ''),
                'role' => (string) ($body['role'] ?? ''),
                'location' => (string) ($body['location'] ?? ''),
                'about' => (string) ($body['about'] ?? ''),
                'skills' => (string) ($body['skills'] ?? ''),
                'website' => (string) ($body['website'] ?? ''),
            ],
            ProfileCardType::MATCH => [
                'location' => (string) ($body['location'] ?? ''),
                'lookingFor' => (string) ($body['lookingFor'] ?? ''),
                'about' => (string) ($body['about'] ?? ''),
                'interests' => (string) ($body['interests'] ?? ''),
            ],
            default => [
                'about' => (string) ($body['about'] ?? ''),
                'details' => (string) ($body['details'] ?? ''),
            ],
        };
    }
}
