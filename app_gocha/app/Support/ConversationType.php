<?php

namespace App\Support;

final class ConversationType
{
    public const DM = 'dm';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::DM];
    }
}
