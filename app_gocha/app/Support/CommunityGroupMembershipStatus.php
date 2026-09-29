<?php

namespace App\Support;

final class CommunityGroupMembershipStatus
{
    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const DECLINED = 'declined';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::PENDING, self::APPROVED, self::DECLINED];
    }
}
