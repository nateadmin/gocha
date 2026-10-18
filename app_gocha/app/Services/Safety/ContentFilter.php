<?php

namespace App\Services\Safety;

/**
 * Masks objectionable words in user-written text (App Store guideline 1.2).
 *
 * Terms come from config('gocha.moderation.blocked_terms'). A trailing `*`
 * matches any word that starts with the term ("fuck*" also masks "fucking").
 * Matching is case-insensitive and whole-word, so "class" is left alone.
 */
class ContentFilter
{
    private ?string $pattern = null;

    /**
     * Cleans every string in a nested array (group post metadata).
     *
     * @param  array<mixed>  $data
     * @return array<mixed>
     */
    public function cleanArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = $this->clean($value);
            } elseif (is_array($value)) {
                $data[$key] = $this->cleanArray($value);
            }
        }

        return $data;
    }

    public function clean(?string $text): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }

        $pattern = $this->pattern();
        if ($pattern === null) {
            return $text;
        }

        // Links are kept intact; only the text between them is masked.
        $parts = preg_split('~(https?://\S+|www\.\S+)~iu', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        if ($parts === false) {
            return $text;
        }

        foreach ($parts as $index => $part) {
            if ($index % 2 === 1) {
                continue;
            }
            $parts[$index] = preg_replace_callback(
                $pattern,
                fn (array $match) => str_repeat('*', mb_strlen($match[0])),
                $part,
            ) ?? $part;
        }

        return implode('', $parts);
    }

    private function pattern(): ?string
    {
        if ($this->pattern !== null) {
            return $this->pattern;
        }

        $alternatives = [];
        foreach ((array) config('gocha.moderation.blocked_terms', []) as $term) {
            $term = mb_strtolower(trim((string) $term));
            if ($term === '') {
                continue;
            }
            $prefix = str_ends_with($term, '*');
            $stem = preg_quote(rtrim($term, '*'), '/');
            $alternatives[] = $prefix ? $stem.'\w*' : $stem;
        }

        if ($alternatives === []) {
            return null;
        }

        return $this->pattern = '/(?<![\w])(?:'.implode('|', $alternatives).')(?![\w])/iu';
    }
}
