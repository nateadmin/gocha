<?php

namespace App\Models;

use App\Support\ConversationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $fillable = [
        'type',
        'name',
        'created_by_user_id',
        'last_message_body',
        'last_message_at',
        'last_message_sender_user_id',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['last_read_at', 'unread_count'])
            ->withTimestamps();
    }

    public function participantRows(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function isDirectMessage(): bool
    {
        return $this->type === ConversationType::DM;
    }

    public function isGroup(): bool
    {
        return $this->type === ConversationType::GROUP;
    }

    public function isBroadcast(): bool
    {
        return $this->type === ConversationType::BROADCAST;
    }

    public function isBroadcastOwner(User $user): bool
    {
        return $this->isBroadcast() && (int) $this->created_by_user_id === (int) $user->id;
    }

    public function scopeListedFor(Builder $query, User $user): Builder
    {
        return $query
            ->whereHas('participantRows', fn ($inner) => $inner->where('user_id', $user->id))
            ->where(function ($inner) use ($user) {
                $inner->where('type', '!=', ConversationType::BROADCAST)
                    ->orWhere('created_by_user_id', $user->id);
            });
    }

    public function displayNameFor(User $viewer): string
    {
        if ($this->isGroup() || $this->isBroadcast()) {
            $name = trim((string) $this->name);
            if ($name !== '') {
                return $name;
            }

            return $this->isBroadcast() ? 'Broadcast' : 'Group';
        }

        return $this->otherParticipant($viewer)?->chatDisplayName() ?? 'Conversation';
    }

    public function otherParticipant(User $viewer): ?User
    {
        return $this->participants
            ->first(fn (User $user) => $user->id !== $viewer->id);
    }
}
