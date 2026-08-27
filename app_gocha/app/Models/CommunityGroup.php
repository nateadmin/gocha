<?php

namespace App\Models;

use App\Support\GroupPrivacy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityGroup extends Model
{
    protected $fillable = [
        'owner_user_id',
        'name',
        'description',
        'privacy',
        'address',
        'city',
        'state',
        'avatar_label',
        'avatar_color',
        'member_count',
    ];

    protected $casts = [
        'member_count' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function isPublic(): bool
    {
        return $this->privacy === GroupPrivacy::PUBLIC;
    }

    public function hasAroundMeLocation(): bool
    {
        if ($this->address && trim($this->address) !== '') {
            return true;
        }

        return $this->city && $this->state
            && trim($this->city) !== ''
            && trim($this->state) !== '';
    }

    public function isDiscoverableInAroundMe(): bool
    {
        return $this->isPublic() && $this->hasAroundMeLocation();
    }

    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'privacy' => $this->privacy,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'avatarLabel' => $this->avatar_label,
            'avatarColor' => $this->avatar_color,
            'memberCount' => $this->member_count,
            'isPublic' => $this->isPublic(),
            'hasLocation' => $this->hasAroundMeLocation(),
            'ownerUserId' => $this->owner_user_id,
        ];
    }
}
