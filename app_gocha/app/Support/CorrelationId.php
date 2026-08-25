<?php

namespace App\Support;

class CorrelationId
{
    public const HEADER = 'X-Correlation-Id';

    public static function current(): string
    {
        return app()->bound(self::class)
            ? app(self::class)
            : (string) str()->uuid();
    }
}
