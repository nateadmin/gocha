<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBlock extends Model
{
    protected $fillable = [
        'blocker_user_id',
        'blocked_user_id',
    ];

    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_user_id');
    }

    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_user_id');
    }

    /** True when either user has blocked the other. */
    public static function existsBetween(int $userA, int $userB): bool
    {
        return static::query()
            ->where(function ($query) use ($userA, $userB) {
                $query->where('blocker_user_id', $userA)->where('blocked_user_id', $userB);
            })
            ->orWhere(function ($query) use ($userA, $userB) {
                $query->where('blocker_user_id', $userB)->where('blocked_user_id', $userA);
            })
            ->exists();
    }

    /**
     * Ids of users hidden from $userId in either direction.
     *
     * @return array<int, int>
     */
    public static function hiddenUserIdsFor(int $userId): array
    {
        $blocked = static::query()->where('blocker_user_id', $userId)->pluck('blocked_user_id');
        $blockers = static::query()->where('blocked_user_id', $userId)->pluck('blocker_user_id');

        return $blocked->merge($blockers)->map(fn ($id) => (int) $id)->unique()->values()->all();
    }
}
