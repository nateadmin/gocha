<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_user_id',
        'type',
        'body',
        'metadata',
        'delivered_at',
        'read_at',
        'deleted_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(MessageResponse::class);
    }

    public function hides(): HasMany
    {
        return $this->hasMany(MessageHide::class);
    }

    public function isDeletedForEveryone(): bool
    {
        return $this->deleted_at !== null;
    }
}
