<?php

namespace App\Support;

final class ConversationType
{
    public const DM = 'dm';

    public const GROUP = 'group';

    public const BROADCAST = 'broadcast';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::DM, self::GROUP, self::BROADCAST];
    }
}
