<?php

namespace App\Support;

final class ProfileCardType
{
    public const PROFESSIONAL = 'professional';
    public const MATCH = 'match';
    public const CUSTOM = 'custom';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::PROFESSIONAL, self::MATCH, self::CUSTOM];
    }

    public static function defaultTitle(string $type): string
    {
        return match ($type) {
            self::PROFESSIONAL => 'Professional',
            self::MATCH => 'Match',
            default => 'Custom',
        };
    }
}
