<?php

namespace App\Support;

final class AccountChannel
{
    public const EMAIL = 'email';

    public const PHONE = 'phone';

    public static function all(): array
    {
        return [self::EMAIL, self::PHONE];
    }
}
