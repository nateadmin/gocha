<?php

namespace App\Models;

use App\Support\StatusType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class StatusItem extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'body',
        'media_path',
        'background_color',
        'duration_ms',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'duration_ms' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(StatusView::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('expires_at', '>', now());
    }

    public function isActive(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isFuture();
    }

    public function mediaUrl(): ?string
    {
        if (! $this->media_path) {
            return null;
        }

        return Storage::disk('public')->url($this->media_path);
    }

    public function isViewedBy(User $viewer): bool
    {
        if ((int) $this->user_id === (int) $viewer->id) {
            return true;
        }

        if ($this->relationLoaded('views')) {
            return $this->views->contains('viewer_user_id', $viewer->id);
        }

        return $this->views()->where('viewer_user_id', $viewer->id)->exists();
    }

    public function deleteMedia(): void
    {
        if ($this->media_path) {
            Storage::disk('public')->delete($this->media_path);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toViewerPayload(User $viewer, bool $includeViewers = false): array
    {
        $viewed = $this->isViewedBy($viewer);

        $payload = [
            'id' => $this->id,
            'userId' => (int) $this->user_id,
            'type' => $this->type,
            'text' => $this->body,
            'mediaUrl' => $this->mediaUrl(),
            'backgroundColor' => $this->background_color ?: StatusType::backgrounds()[0],
            'durationMs' => (int) $this->duration_ms,
            'createdAt' => $this->created_at?->toIso8601String(),
            'expiresAt' => $this->expires_at?->toIso8601String(),
            'viewed' => $viewed,
        ];

        if ($includeViewers && (int) $this->user_id === (int) $viewer->id) {
            $payload['viewCount'] = $this->relationLoaded('views')
                ? $this->views->count()
                : $this->views()->count();
        }

        return $payload;
    }
}
