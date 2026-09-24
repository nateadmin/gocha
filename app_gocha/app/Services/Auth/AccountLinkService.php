<?php

namespace App\Services\Auth;

use App\Models\AccountLink;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class AccountLinkService
{
    /**
     * @return array{0: int, 1: int}
     */
    public function orderedPair(int $left, int $right): array
    {
        if ($left === $right) {
            throw ValidationException::withMessages([
                'userId' => ['You cannot link an account to itself.'],
            ]);
        }

        return $left < $right ? [$left, $right] : [$right, $left];
    }

    public function link(User $left, User $right): AccountLink
    {
        [$low, $high] = $this->orderedPair($left->id, $right->id);

        return AccountLink::query()->firstOrCreate([
            'user_id_low' => $low,
            'user_id_high' => $high,
        ]);
    }

    public function unlink(User $actor, int $otherUserId): void
    {
        [$low, $high] = $this->orderedPair($actor->id, $otherUserId);

        AccountLink::query()
            ->where('user_id_low', $low)
            ->where('user_id_high', $high)
            ->delete();
    }

    public function areLinked(int $left, int $right): bool
    {
        if ($left === $right) {
            return false;
        }

        [$low, $high] = $this->orderedPair($left, $right);

        return AccountLink::query()
            ->where('user_id_low', $low)
            ->where('user_id_high', $high)
            ->exists();
    }

    /**
     * @return Collection<int, User>
     */
    public function linkedUsers(User $user): Collection
    {
        $links = AccountLink::query()
            ->where('user_id_low', $user->id)
            ->orWhere('user_id_high', $user->id)
            ->get();

        $otherIds = $links->map(fn (AccountLink $link) => $link->otherUserId($user->id))->all();
        if ($otherIds === []) {
            return collect();
        }

        return User::query()
            ->whereIn('id', $otherIds)
            ->with('activeBusinessListing')
            ->orderBy('id')
            ->get();
    }
}
