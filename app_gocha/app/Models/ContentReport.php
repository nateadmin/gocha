<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentReport extends Model
{
    public const REASONS = ['spam', 'harassment', 'hate', 'sexual', 'violence', 'scam', 'other'];

    public const STATUS_OPEN = 'open';

    public const STATUS_RESOLVED = 'resolved';

    protected $fillable = [
        'reporter_user_id',
        'reported_user_id',
        'conversation_id',
        'message_id',
        'status_item_id',
        'reason',
        'details',
        'message_excerpt',
        'status',
        'resolved_by_user_id',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function reportedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    public function toAdminPayload(): array
    {
        return [
            'id' => $this->id,
            'reason' => $this->reason,
            'details' => $this->details,
            'messageExcerpt' => $this->message_excerpt,
            'status' => $this->status,
            'conversationId' => $this->conversation_id,
            'messageId' => $this->message_id,
            'statusItemId' => $this->status_item_id,
            'reporter' => $this->reporter ? [
                'id' => $this->reporter->id,
                'displayName' => $this->reporter->publicDisplayName(),
            ] : null,
            'reportedUser' => $this->reportedUser ? [
                'id' => $this->reportedUser->id,
                'displayName' => $this->reportedUser->publicDisplayName(),
                'username' => $this->reportedUser->username,
            ] : null,
            'createdAt' => $this->created_at?->toIso8601String(),
            'resolvedAt' => $this->resolved_at?->toIso8601String(),
        ];
    }
}
