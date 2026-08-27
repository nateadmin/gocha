<?php

namespace App\Support;

final class ProfileMode
{
    public const PERSONAL = 'personal';

    public const BUSINESS = 'business';

    public static function all(): array
    {
        return [self::PERSONAL, self::BUSINESS];
    }
}
