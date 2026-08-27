<?php

namespace App\Support;

final class BusinessListingStatus
{
    public const DRAFT = 'draft';

    public const PENDING_REVIEW = 'pending_review';

    public const APPROVED = 'approved';

    public const REJECTED = 'rejected';

    public const UNPUBLISHED = 'unpublished';

    public static function publicStatuses(): array
    {
        return [self::APPROVED];
    }
}
