<?php

namespace App\Services\Locale;

class TranslationBudget
{
    private int $used = 0;

    public function __construct(private readonly int $max = MessageTranslationService::PER_REQUEST_REMOTE_LIMIT) {}

    public function consume(): bool
    {
        if ($this->used >= $this->max) {
            return false;
        }

        $this->used++;

        return true;
    }
}
