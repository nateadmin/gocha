<?php

namespace App\Support;

final class ProfileCardVisibility
{
    public const PUBLIC = 'public';
    public const REQUEST = 'request';
    public const PRIVATE = 'private';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::PUBLIC, self::REQUEST, self::PRIVATE];
    }
}
