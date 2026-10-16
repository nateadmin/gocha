<?php

namespace App\Models;

use App\Services\Safety\ContentFilter;
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


    protected static function booted(): void
    {
        // Mask objectionable words in user-written text before it is stored.
        static::saving(function (self $model) {
            if ($model->isDirty('body') && is_string($model->body)) {
                $model->body = app(ContentFilter::class)->clean($model->body);
            }
            // Group posts keep their visible text (titles, poll options) here.
            if ($model->isDirty('metadata') && is_array($model->metadata)) {
                $model->metadata = app(ContentFilter::class)->cleanArray($model->metadata);
            }
        });
    }

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
