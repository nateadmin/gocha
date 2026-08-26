<?php

namespace App\Services\Profile;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CharacterAvatarService
{
    public function assignDefault(User $user): void
    {
        $path = 'avatars/'.$user->id.'-'.Str::uuid().'.svg';
        $svg = $this->buildCharacterSvg($user->email ?: (string) $user->id);
        $disk = Storage::disk('public');
        $disk->makeDirectory('avatars');
        $disk->put($path, $svg);
        $user->forceFill(['avatar_path' => $path])->save();
    }

    public function storeUpload(User $user, string $binary, string $extension): string
    {
        $path = 'avatars/'.$user->id.'-'.Str::uuid().'.'.$extension;
        $disk = Storage::disk('public');
        $disk->makeDirectory('avatars');
        $disk->put($path, $binary);

        if ($user->avatar_path) {
            $disk->delete($user->avatar_path);
        }

        $user->forceFill(['avatar_path' => $path])->save();

        return $path;
    }

    private function buildCharacterSvg(string $seed): string
    {
        $hash = hash('sha256', $seed);
        $primary = '#'.substr($hash, 0, 6);
        $accent = '#'.substr($hash, 6, 6);
        $eyeY = 68 + (hexdec(substr($hash, 12, 2)) % 10);
        $mouth = hexdec(substr($hash, 14, 2)) % 2 === 0 ? 'arc' : 'line';

        $mouthPath = $mouth === 'arc'
            ? '<path d="M70 98 Q100 112 130 98" stroke="'.$accent.'" stroke-width="6" fill="none" stroke-linecap="round"/>'
            : '<line x1="78" y1="102" x2="122" y2="102" stroke="'.$accent.'" stroke-width="6" stroke-linecap="round"/>';

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Gocha character avatar">
  <rect width="200" height="200" rx="32" fill="{$primary}"/>
  <rect x="36" y="40" width="128" height="120" rx="28" fill="#1a1b2e"/>
  <circle cx="78" cy="{$eyeY}" r="10" fill="{$accent}"/>
  <circle cx="122" cy="{$eyeY}" r="10" fill="{$accent}"/>
  {$mouthPath}
  <rect x="62" y="24" width="18" height="18" rx="4" fill="{$accent}"/>
  <rect x="120" y="24" width="18" height="18" rx="4" fill="{$accent}"/>
</svg>
SVG;
    }
}
