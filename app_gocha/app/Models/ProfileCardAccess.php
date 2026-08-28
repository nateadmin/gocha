<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileCardAccess extends Model
{
    protected $fillable = [
        'profile_card_id',
        'viewer_user_id',
        'status',
        'requested_at',
        'decided_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'decided_at' => 'datetime',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(ProfileCard::class, 'profile_card_id');
    }

    public function viewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'viewer_user_id');
    }
}
