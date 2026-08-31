<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PipelineHeartbeat extends Model
{
    protected $fillable = [
        'lock_domain',
        'completed_at',
        'row_count',
        'correlation_id',
        'skip_streak',
        'last_skip_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'last_skip_at' => 'datetime',
        'skip_streak' => 'integer',
        'row_count' => 'integer',
    ];
}
