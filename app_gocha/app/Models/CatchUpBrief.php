<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatchUpBrief extends Model
{
    protected $fillable = [
        'user_id',
        'conversation_id',
        'summary',
        'attention',
        'plans',
        'priority',
        'source_message_id',
        'source_created_at',
        'generated_at',
    ];

    protected $casts = [
        'attention' => 'array',
        'plans' => 'array',
        'source_created_at' => 'datetime',
        'generated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
