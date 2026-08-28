<?php

namespace App\Services\Profile;

use App\Models\ProfileCard;
use App\Models\ProfileCardAccess;
use App\Models\User;
use App\Support\ProfileCardAccessStatus;
use App\Support\ProfileCardType;
use App\Support\ProfileCardVisibility;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ProfileCardService
{
    public function create(User $owner, array $input): ProfileCard
    {
        $type = $input['type'];
        $title = trim((string) ($input['title'] ?? '')) ?: ProfileCardType::defaultTitle($type);

        $card = ProfileCard::query()->create([
            'user_id' => $owner->id,
            'type' => $type,
            'title' => $title,
            'slug' => $this->allocateSlug($owner, $type, $input['slug'] ?? null),
            'headline' => $this->nullableString($input['headline'] ?? null),
            'visibility' => $input['visibility'] ?? ProfileCardVisibility::REQUEST,
            'body' => $this->sanitizeBody($type, $input['body'] ?? []),
        ]);

        return $card->load(['owner', 'accesses']);
    }

    public function update(ProfileCard $card, array $input): ProfileCard
    {
        $card->loadMissing('owner');
        $type = $input['type'] ?? $card->type;
        $title = array_key_exists('title', $input)
            ? (trim((string) $input['title']) ?: ProfileCardType::defaultTitle($type))
            : $card->title;
        $owner = $card->owner;
        if (! $owner) {
            throw new AccessDeniedHttpException('You do not own this profile.');
        }
        $slug = array_key_exists('slug', $input)
            ? $this->allocateSlug($owner, $type, $input['slug'], $card->id)
            : ($card->slug ?: $this->allocateSlug($owner, $type, null, $card->id));

        $card->forceFill([
            'type' => $type,
            'title' => $title,
            'slug' => $slug,
            'headline' => array_key_exists('headline', $input)
                ? $this->nullableString($input['headline'])
                : $card->headline,
            'visibility' => $input['visibility'] ?? $card->visibility,
            'body' => array_key_exists('body', $input)
                ? $this->sanitizeBody($type, $input['body'] ?? [])
                : $card->body,
        ])->save();

        return $card->fresh(['owner', 'accesses']);
    }

    public function delete(ProfileCard $card): void
    {
        $card->delete();
    }

    /** @return Collection<int, ProfileCard> */
    public function cardsForOwner(User $owner): Collection
    {
        return ProfileCard::query()
            ->where('user_id', $owner->id)
            ->with(['owner', 'accesses'])
            ->orderBy('created_at')
            ->get();
    }

    /** @return Collection<int, ProfileCard> */
    public function cardsListedForViewer(User $owner, User $viewer): Collection
    {
        return ProfileCard::query()
            ->where('user_id', $owner->id)
            ->with(['owner', 'accesses' => fn ($query) => $query->where('viewer_user_id', $viewer->id)])
            ->orderBy('created_at')
            ->get()
            ->filter(fn (ProfileCard $card) => $card->listedForViewer($viewer))
            ->values();
    }

    public function requestAccess(ProfileCard $card, User $viewer): ProfileCardAccess
    {
        if ($card->user_id === $viewer->id) {
            throw ValidationException::withMessages([
                'card' => ['You already own this profile.'],
            ]);
        }

        if (! $card->isRequestOnly()) {
            throw new AccessDeniedHttpException('This profile is not open for access requests.');
        }

        $access = ProfileCardAccess::query()->firstOrNew([
            'profile_card_id' => $card->id,
            'viewer_user_id' => $viewer->id,
        ]);

        if ($access->status === ProfileCardAccessStatus::APPROVED) {
            return $access;
        }

        $access->forceFill([
            'status' => ProfileCardAccessStatus::PENDING,
            'requested_at' => now(),
            'decided_at' => null,
        ])->save();

        return $access->fresh(['viewer', 'card']);
    }

    public function grant(ProfileCard $card, User $viewer): ProfileCardAccess
    {
        if ($card->user_id === $viewer->id) {
            throw ValidationException::withMessages([
                'userId' => ['You already own this profile.'],
            ]);
        }

        $access = ProfileCardAccess::query()->firstOrNew([
            'profile_card_id' => $card->id,
            'viewer_user_id' => $viewer->id,
        ]);

        $access->forceFill([
            'status' => ProfileCardAccessStatus::APPROVED,
            'requested_at' => $access->requested_at ?? now(),
            'decided_at' => now(),
        ])->save();

        return $access->fresh(['viewer', 'card']);
    }

    public function decide(ProfileCardAccess $access, User $owner, string $status): ProfileCardAccess
    {
        if ($access->card->user_id !== $owner->id) {
            throw new AccessDeniedHttpException('You cannot decide access for this profile.');
        }

        $access->forceFill([
            'status' => $status,
            'decided_at' => now(),
        ])->save();

        return $access->fresh(['viewer', 'card.owner']);
    }

    /** @return Collection<int, ProfileCardAccess> */
    public function pendingRequestsFor(User $owner): Collection
    {
        return ProfileCardAccess::query()
            ->where('status', ProfileCardAccessStatus::PENDING)
            ->whereHas('card', fn ($query) => $query->where('user_id', $owner->id))
            ->with(['viewer', 'card'])
            ->orderByDesc('requested_at')
            ->get();
    }

    public function assertCanViewDetail(ProfileCard $card, User $viewer): void
    {
        $card->loadMissing(['owner', 'accesses' => fn ($query) => $query->where('viewer_user_id', $viewer->id)]);

        if (! $card->viewerCanSeeDetail($viewer)) {
            throw new AccessDeniedHttpException('You do not have access to this profile.');
        }
    }

    public function assertOwner(ProfileCard $card, User $user): void
    {
        if ($card->user_id !== $user->id) {
            throw new AccessDeniedHttpException('You do not own this profile.');
        }
    }

    /** @param array<string, mixed> $body */
    public function sanitizeBody(string $type, array $body): array
    {
        $string = fn ($key) => trim((string) ($body[$key] ?? ''));

        return match ($type) {
            ProfileCardType::PROFESSIONAL => [
                'company' => mb_substr($string('company'), 0, 120),
                'role' => mb_substr($string('role'), 0, 120),
                'location' => mb_substr($string('location'), 0, 120),
                'about' => mb_substr($string('about'), 0, 2000),
                'skills' => mb_substr($string('skills'), 0, 500),
                'website' => mb_substr($string('website'), 0, 255),
            ],
            ProfileCardType::MATCH => [
                'location' => mb_substr($string('location'), 0, 120),
                'lookingFor' => mb_substr($string('lookingFor'), 0, 160),
                'about' => mb_substr($string('about'), 0, 2000),
                'interests' => mb_substr($string('interests'), 0, 500),
            ],
            default => [
                'about' => mb_substr($string('about'), 0, 2000),
                'details' => mb_substr($string('details'), 0, 2000),
            ],
        };
    }

    public function findBySlug(string $slug): ProfileCard
    {
        $normalized = $this->normalizeSlug($slug);
        if ($normalized === '') {
            abort(404, 'Profile not found.');
        }

        $card = ProfileCard::query()
            ->where('slug', $normalized)
            ->with('owner')
            ->first();

        if (! $card) {
            abort(404, 'Profile not found.');
        }

        return $card;
    }

    public function allocateSlug(User $owner, string $type, mixed $requested, ?int $ignoreCardId = null): string
    {
        $custom = is_string($requested) ? $this->normalizeSlug($requested) : '';
        if ($custom !== '') {
            if ($this->slugTaken($custom, $ignoreCardId)) {
                throw ValidationException::withMessages([
                    'slug' => ['That link is already taken.'],
                ]);
            }

            return $custom;
        }

        $base = $this->defaultSlugBase($owner, $type);
        $candidate = $base;
        $n = 2;
        while ($this->slugTaken($candidate, $ignoreCardId)) {
            $suffix = '-'.$n;
            $candidate = substr($base, 0, 48 - strlen($suffix)).$suffix;
            $n++;
        }

        return $candidate;
    }

    public function normalizeSlug(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?: '';
        $slug = trim($slug, '-');

        return substr($slug, 0, 48);
    }

    private function defaultSlugBase(User $owner, string $type): string
    {
        $prefix = $this->normalizeSlug((string) $owner->username);
        if ($prefix === '') {
            $prefix = 'u'.$owner->id;
        }
        $typePart = $this->normalizeSlug($type) ?: 'card';
        $base = $this->normalizeSlug($prefix.'-'.$typePart);

        return $base !== '' ? $base : 'card';
    }

    private function slugTaken(string $slug, ?int $ignoreCardId): bool
    {
        $query = ProfileCard::query()->where('slug', $slug);
        if ($ignoreCardId) {
            $query->where('id', '!=', $ignoreCardId);
        }

        return $query->exists();
    }

    private function nullableString(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : mb_substr($trimmed, 0, 160);
    }
}
