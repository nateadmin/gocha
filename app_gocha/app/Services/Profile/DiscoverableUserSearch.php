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
        if ($trimmed === '') {
            return collect();
        }

        if (str_starts_with($trimmed, '@')) {
            return $this->searchByUsername($viewer, $trimmed, $excludeUserIds);
        }

        return $this->searchByExactName($viewer, $trimmed, $excludeUserIds);
    }

    /**
     * @param  list<int>  $excludeUserIds
     * @return Collection<int, User>
     */
    private function searchByUsername(User $viewer, string $needle, array $excludeUserIds): Collection
    {
        $username = strtolower(ltrim(substr($needle, 1), '@'));
        if ($username === '') {
            return collect();
        }

        return $this->baseQuery($viewer, $excludeUserIds)
            ->where('username', $username)
            ->orderBy('name')
            ->limit(20)
            ->get();
    }

    /**
     * @param  list<int>  $excludeUserIds
     * @return Collection<int, User>
     */
    private function searchByExactName(User $viewer, string $needle, array $excludeUserIds): Collection
    {
        return $this->baseQuery($viewer, $excludeUserIds)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($needle)])
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
}
