<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'display_name',
        'email',
        'password',
        'status',
        'bio',
        'phone',
        'avatar_path',
        'discoverable',
        'onboarding_completed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'onboarding_completed_at' => 'datetime',
        'discoverable' => 'boolean',
        'password' => 'hashed',
    ];

    public function needsOnboarding(): bool
    {
        return $this->onboarding_completed_at === null;
    }

    public function publicDisplayName(): string
    {
        return $this->display_name ?: $this->name ?: 'Gotcha user';
    }

    public function avatarUrl(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }

    public function toAuthPayload(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'displayName' => $this->publicDisplayName(),
            'status' => $this->status,
            'bio' => $this->bio,
            'phone' => $this->phone,
            'avatarUrl' => $this->avatarUrl(),
            'discoverable' => $this->discoverable,
            'needsOnboarding' => $this->needsOnboarding(),
        ];
    }

    public function toPublicProfilePayload(): array
    {
        return [
            'id' => $this->id,
            'displayName' => $this->publicDisplayName(),
            'status' => $this->status,
            'bio' => $this->bio,
            'avatarUrl' => $this->avatarUrl(),
        ];
    }
}
