<?php

namespace App\Support;

final class MessageType
{
    public const TEXT = 'text';

    public const EMOJI = 'emoji';

    public const OFFER = 'offer';

    public const POLL = 'poll';

    public const RSVP = 'rsvp';

    /** @return list<string> */
    public static function all(): array
    {
        return [self::TEXT, self::EMOJI, self::OFFER, self::POLL, self::RSVP];
    }

    /** @return list<string> */
    public static function interactive(): array
    {
        return [self::OFFER, self::POLL, self::RSVP];
    }

    public static function isInteractive(string $type): bool
    {
        return in_array($type, self::interactive(), true);
    }
}
