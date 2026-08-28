<?php

namespace App\Models;

use App\Support\ConversationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $fillable = [
        'type',
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

    public function otherParticipant(User $viewer): ?User
    {
        return $this->participants
            ->first(fn (User $user) => $user->id !== $viewer->id);
    }
}
