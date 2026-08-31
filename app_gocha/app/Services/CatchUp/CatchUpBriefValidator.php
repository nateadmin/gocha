<?php

namespace App\Services\CatchUp;

use InvalidArgumentException;

class CatchUpBriefValidator
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array{summary: string, attention: array<int, string>, plans: array<int, array{when: string, what: string}>, priority: string}
     */
    public function validate(array $payload): array
    {
        $allowed = ['summary', 'attention', 'plans', 'priority'];
        $unknown = array_diff(array_keys($payload), $allowed);
        if ($unknown !== []) {
            throw new InvalidArgumentException('Catch Up payload has unknown fields.');
        }

        foreach ($allowed as $key) {
            if (! array_key_exists($key, $payload)) {
                throw new InvalidArgumentException('Catch Up payload is missing '.$key.'.');
            }
        }

        if (! is_string($payload['summary'])) {
            throw new InvalidArgumentException('Catch Up summary must be a string.');
        }

        $summary = $this->cleanText($payload['summary'], 2000);
        if ($summary === '') {
            throw new InvalidArgumentException('Catch Up summary is empty.');
        }

        if (! is_array($payload['attention']) || count($payload['attention']) > 8) {
            throw new InvalidArgumentException('Catch Up attention must be an array of up to 8 items.');
        }

        $attention = [];
        foreach ($payload['attention'] as $item) {
            if (! is_string($item)) {
                throw new InvalidArgumentException('Catch Up attention items must be strings.');
            }
            $text = $this->cleanText($item, 400);
            if ($text !== '') {
                $attention[] = $text;
            }
        }

        if (! is_array($payload['plans']) || count($payload['plans']) > 8) {
            throw new InvalidArgumentException('Catch Up plans must be an array of up to 8 items.');
        }

        $plans = [];
        foreach ($payload['plans'] as $plan) {
            if (! is_array($plan)) {
                throw new InvalidArgumentException('Catch Up plans must be objects.');
            }
            $planUnknown = array_diff(array_keys($plan), ['when', 'what']);
            if ($planUnknown !== []) {
                throw new InvalidArgumentException('Catch Up plan has unknown fields.');
            }
            if (! isset($plan['when'], $plan['what']) || ! is_string($plan['when']) || ! is_string($plan['what'])) {
                throw new InvalidArgumentException('Catch Up plan must include when and what strings.');
            }
            $when = $this->cleanText($plan['when'], 80);
            $what = $this->cleanText($plan['what'], 240);
            if ($what === '') {
                continue;
            }
            $plans[] = [
                'when' => $when,
                'what' => $what,
            ];
        }

        if (! is_string($payload['priority'])) {
            throw new InvalidArgumentException('Catch Up priority must be a string.');
        }

        $priority = strtolower(trim($payload['priority']));
        if (! in_array($priority, ['high', 'medium', 'low'], true)) {
            throw new InvalidArgumentException('Catch Up priority must be high, medium, or low.');
        }

        return [
            'summary' => $summary,
            'attention' => array_values($attention),
            'plans' => array_values($plans),
            'priority' => $priority,
        ];
    }

    private function cleanText(string $value, int $max): string
    {
        $value = str_replace(["\u{2014}", "\u{2013}", '—', '–'], ', ', $value);
        $value = trim(preg_replace('/\s+/', ' ', $value) ?? $value);

        if (strlen($value) > $max) {
            $value = rtrim(substr($value, 0, $max));
        }

        return $value;
    }
}
