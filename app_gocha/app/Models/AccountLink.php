<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountLink extends Model
{
    protected $fillable = [
        'user_id_low',
        'user_id_high',
    ];

    public function lowerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id_low');
    }

    public function higherUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id_high');
    }

    public function otherUserId(int $userId): int
    {
        return $this->user_id_low === $userId ? $this->user_id_high : $this->user_id_low;
    }
}
