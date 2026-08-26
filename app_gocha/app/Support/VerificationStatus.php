<?php

namespace App\Support;

final class VerificationStatus
{
    public const NONE = 'none';

    public const PENDING = 'pending';

    public const VERIFIED = 'verified';

    public const REJECTED = 'rejected';

    public static function all(): array
    {
        return [self::NONE, self::PENDING, self::VERIFIED, self::REJECTED];
    }
}
