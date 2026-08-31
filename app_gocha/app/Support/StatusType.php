<?php

namespace App\Support;

class StatusType
{
    public const TEXT = 'text';
    public const IMAGE = 'image';
    public const VIDEO = 'video';

    public const TEXT_DURATION_MS = 5000;
    public const IMAGE_DURATION_MS = 5000;
    public const VIDEO_DEFAULT_MS = 15000;
    public const VIDEO_MAX_MS = 30000;
    public const MAX_ACTIVE_PER_USER = 30;
    public const LIFETIME_HOURS = 24;

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [self::TEXT, self::IMAGE, self::VIDEO];
    }

    /**
     * @return list<string>
     */
    public static function backgrounds(): array
    {
        return [
            '#1B00D8',
            '#00669c',
            '#00734a',
            '#5b42f3',
            '#c45c26',
            '#3d9a8b',
            '#5b8def',
            '#e07a5f',
            '#111827',
            '#7c3aed',
        ];
    }

    public static function defaultDuration(string $type): int
    {
        return match ($type) {
            self::VIDEO => self::VIDEO_DEFAULT_MS,
            self::IMAGE => self::IMAGE_DURATION_MS,
            default => self::TEXT_DURATION_MS,
        };
    }
}
