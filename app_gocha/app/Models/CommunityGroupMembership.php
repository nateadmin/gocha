<?php

namespace App\Models;

use App\Support\CommunityGroupMembershipStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityGroupMembership extends Model
{
    protected $fillable = [
        'community_group_id',
        'user_id',
        'status',
        'role',
        'requested_at',
        'decided_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'decided_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(CommunityGroup::class, 'community_group_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isPending(): bool
    {
        return $this->status === CommunityGroupMembershipStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === CommunityGroupMembershipStatus::APPROVED;
    }

    public function isOwnerRole(): bool
    {
        return $this->role === 'owner';
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        $user = $this->relationLoaded('user') ? $this->user : $this->user()->first();
        $group = $this->relationLoaded('group') ? $this->group : $this->group()->first();

        return [
            'id' => $this->id,
            'groupId' => $this->community_group_id,
            'groupName' => $group?->name,
            'status' => $this->status,
            'role' => $this->role,
            'requestedAt' => $this->requested_at?->toIso8601String(),
            'decidedAt' => $this->decided_at?->toIso8601String(),
            'user' => $user ? [
                'id' => $user->id,
                'displayName' => $user->publicDisplayName(),
                'username' => $user->username,
            ] : null,
        ];
    }
}
