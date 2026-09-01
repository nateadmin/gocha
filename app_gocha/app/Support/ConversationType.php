<?php

namespace App\Support;

final class ConversationType
{
    public const DM = 'dm';

    public const GROUP = 'group';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::DM, self::GROUP];
    }
}
