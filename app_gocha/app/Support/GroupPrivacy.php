<?php

namespace App\Support;

final class GroupPrivacy
{
    public const PUBLIC = 'public';

    public const PRIVATE = 'private';

    public static function all(): array
    {
        return [self::PUBLIC, self::PRIVATE];
    }
}
