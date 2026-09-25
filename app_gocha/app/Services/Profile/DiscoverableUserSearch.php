<?php

namespace App\Services\Profile;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class DiscoverableUserSearch
{
    /**
     * @param  list<int>  $excludeUserIds
     * @return Collection<int, User>
     */
    public function search(User $viewer, string $needle, array $excludeUserIds = []): Collection
    {
        $trimmed = trim($needle);
        if ($trimmed === '' || mb_strlen($trimmed) < 2) {
            return collect();
        }

        $query = $this->baseQuery($viewer, $excludeUserIds);
        $this->applyNeedle($query, $trimmed);

        return $query
            ->orderBy('name')
            ->limit(20)
            ->get();
    }

    /**
     * @param  list<int>  $excludeUserIds
     * @return Builder<User>
     */
    private function baseQuery(User $viewer, array $excludeUserIds): Builder
    {
        return User::query()
            ->where('id', '!=', $viewer->id)
            ->where('discoverable', true)
            ->when($excludeUserIds !== [], fn (Builder $query) => $query->whereNotIn('id', $excludeUserIds));
    }

    /**
     * @param  Builder<User>  $query
     */
    private function applyNeedle(Builder $query, string $needle): void
    {
        $lower = mb_strtolower($needle);
        $usernameNeedle = ltrim($lower, '@');
        $like = $this->likeContains($lower);
        $usernameLike = $this->likeContains($usernameNeedle);

        $query->where(function (Builder $match) use ($lower, $like, $usernameNeedle, $usernameLike) {
            $match->whereRaw('LOWER(name) LIKE ?', [$like]);

            if ($usernameNeedle !== '') {
                $match->orWhereRaw('LOWER(username) LIKE ?', [$usernameLike]);
            }

            if (str_contains($lower, '@')) {
                $match->orWhereRaw('LOWER(email) = ?', [$lower]);
                $match->orWhereRaw('LOWER(email) LIKE ?', [$like]);
            }
        });
    }

    private function likeContains(string $needle): string
    {
        $safe = str_replace('%', '', $needle);

        return '%'.$safe.'%';
    }
}
