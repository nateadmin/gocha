<?php

namespace App\Support;

class AppLanguage
{
    public const DEFAULT = 'en';

    /**
     * ISO 639-1 codes the account picker and message translator accept.
     *
     * @return list<string>
     */
    public static function codes(): array
    {
        return array_keys(self::catalog());
    }

    /**
     * @return array<string, array{name: string, nativeName: string, rtl: bool}>
     */
    public static function catalog(): array
    {
        return [
            'en' => ['name' => 'English', 'nativeName' => 'English', 'rtl' => false],
            'he' => ['name' => 'Hebrew', 'nativeName' => 'עברית', 'rtl' => true],
            'es' => ['name' => 'Spanish', 'nativeName' => 'Español', 'rtl' => false],
            'fr' => ['name' => 'French', 'nativeName' => 'Français', 'rtl' => false],
            'ar' => ['name' => 'Arabic', 'nativeName' => 'العربية', 'rtl' => true],
            'ru' => ['name' => 'Russian', 'nativeName' => 'Русский', 'rtl' => false],
            'de' => ['name' => 'German', 'nativeName' => 'Deutsch', 'rtl' => false],
            'pt' => ['name' => 'Portuguese', 'nativeName' => 'Português', 'rtl' => false],
            'zh' => ['name' => 'Chinese', 'nativeName' => '中文', 'rtl' => false],
            'ja' => ['name' => 'Japanese', 'nativeName' => '日本語', 'rtl' => false],
            'ko' => ['name' => 'Korean', 'nativeName' => '한국어', 'rtl' => false],
            'hi' => ['name' => 'Hindi', 'nativeName' => 'हिन्दी', 'rtl' => false],
            'it' => ['name' => 'Italian', 'nativeName' => 'Italiano', 'rtl' => false],
            'nl' => ['name' => 'Dutch', 'nativeName' => 'Nederlands', 'rtl' => false],
            'pl' => ['name' => 'Polish', 'nativeName' => 'Polski', 'rtl' => false],
            'tr' => ['name' => 'Turkish', 'nativeName' => 'Türkçe', 'rtl' => false],
            'uk' => ['name' => 'Ukrainian', 'nativeName' => 'Українська', 'rtl' => false],
            'vi' => ['name' => 'Vietnamese', 'nativeName' => 'Tiếng Việt', 'rtl' => false],
            'th' => ['name' => 'Thai', 'nativeName' => 'ไทย', 'rtl' => false],
            'id' => ['name' => 'Indonesian', 'nativeName' => 'Bahasa Indonesia', 'rtl' => false],
            'fa' => ['name' => 'Persian', 'nativeName' => 'فارسی', 'rtl' => true],
            'el' => ['name' => 'Greek', 'nativeName' => 'Ελληνικά', 'rtl' => false],
            'sv' => ['name' => 'Swedish', 'nativeName' => 'Svenska', 'rtl' => false],
            'no' => ['name' => 'Norwegian', 'nativeName' => 'Norsk', 'rtl' => false],
            'da' => ['name' => 'Danish', 'nativeName' => 'Dansk', 'rtl' => false],
            'fi' => ['name' => 'Finnish', 'nativeName' => 'Suomi', 'rtl' => false],
            'cs' => ['name' => 'Czech', 'nativeName' => 'Čeština', 'rtl' => false],
            'ro' => ['name' => 'Romanian', 'nativeName' => 'Română', 'rtl' => false],
            'hu' => ['name' => 'Hungarian', 'nativeName' => 'Magyar', 'rtl' => false],
            'ur' => ['name' => 'Urdu', 'nativeName' => 'اردو', 'rtl' => true],
            'bn' => ['name' => 'Bengali', 'nativeName' => 'বাংলা', 'rtl' => false],
        ];
    }

    /**
     * @return list<array{code: string, name: string, nativeName: string, rtl: bool}>
     */
    public static function options(): array
    {
        $options = [];
        foreach (self::catalog() as $code => $meta) {
            $options[] = [
                'code' => $code,
                'name' => $meta['name'],
                'nativeName' => $meta['nativeName'],
                'rtl' => $meta['rtl'],
            ];
        }

        return $options;
    }

    public static function isSupported(?string $code): bool
    {
        return self::normalize($code) !== null;
    }

    public static function normalize(?string $code): ?string
    {
        if (! is_string($code) || trim($code) === '') {
            return null;
        }

        $code = strtolower(str_replace('_', '-', trim($code)));
        $base = explode('-', $code)[0];
        $aliases = [
            'iw' => 'he',
            'in' => 'id',
            'nb' => 'no',
            'nn' => 'no',
            'cmn' => 'zh',
        ];
        $base = $aliases[$base] ?? $base;

        return array_key_exists($base, self::catalog()) ? $base : null;
    }

    public static function forCountry(?string $country): ?string
    {
        if (! is_string($country) || trim($country) === '') {
            return null;
        }

        $country = strtoupper(trim($country));
        $map = self::countryMap();

        return $map[$country] ?? null;
    }

    public static function countryFromPhone(?string $phone): ?string
    {
        if (! is_string($phone) || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/[^\d+]/', '', $phone) ?? '';
        if ($digits === '') {
            return null;
        }
        if (! str_starts_with($digits, '+')) {
            $digits = '+'.$digits;
        }

        foreach (self::phonePrefixes() as $prefix => $country) {
            if (str_starts_with($digits, $prefix)) {
                return $country;
            }
        }

        return null;
    }

    public static function countryFromRequestHeaders(?string $cfIpCountry, ?string $cloudfrontCountry, ?string $appEngineCountry, ?string $countryCode): ?string
    {
        foreach ([$cfIpCountry, $cloudfrontCountry, $appEngineCountry, $countryCode] as $value) {
            if (! is_string($value)) {
                continue;
            }
            $value = strtoupper(trim($value));
            if (preg_match('/^[A-Z]{2}$/', $value) === 1 && $value !== 'XX' && $value !== 'ZZ') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Explicit language wins, then client country, phone country, IP country, then English.
     */
    public static function resolve(
        ?string $language = null,
        ?string $country = null,
        ?string $phone = null,
        ?string $ipCountry = null,
    ): string {
        if ($resolved = self::normalize($language)) {
            return $resolved;
        }

        foreach ([$country, self::countryFromPhone($phone), $ipCountry] as $candidate) {
            if ($mapped = self::forCountry(is_string($candidate) ? $candidate : null)) {
                return $mapped;
            }
        }

        return self::DEFAULT;
    }

    public static function detectScriptLanguage(string $text): ?string
    {
        if (preg_match('/\p{Hebrew}/u', $text) === 1) {
            return 'he';
        }
        if (preg_match('/\p{Arabic}/u', $text) === 1) {
            return 'ar';
        }
        if (preg_match('/\p{Hiragana}|\p{Katakana}/u', $text) === 1) {
            return 'ja';
        }
        if (preg_match('/\p{Hangul}/u', $text) === 1) {
            return 'ko';
        }
        if (preg_match('/\p{Han}/u', $text) === 1) {
            return 'zh';
        }
        if (preg_match('/\p{Cyrillic}/u', $text) === 1) {
            return 'ru';
        }
        if (preg_match('/\p{Greek}/u', $text) === 1) {
            return 'el';
        }
        if (preg_match('/\p{Thai}/u', $text) === 1) {
            return 'th';
        }
        if (preg_match('/\p{Devanagari}/u', $text) === 1) {
            return 'hi';
        }
        if (preg_match('/\p{Bengali}/u', $text) === 1) {
            return 'bn';
        }

        return null;
    }

    public static function looksLikeEnglish(string $text): bool
    {
        $words = preg_split('/[^\p{L}]+/u', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ($words === []) {
            return false;
        }

        $markers = [
            'the', 'a', 'an', 'is', 'are', 'am', 'to', 'you', 'i', 'we', 'and', 'of', 'in',
            'it', 'for', 'on', 'that', 'this', 'with', 'hey', 'hi', 'hello', 'yes', 'no',
            'ok', 'okay', 'please', 'thanks', 'thank', 'what', 'how', 'are', 'your', 'me',
            'my', 'just', 'can', 'will', 'be', 'have', 'has', 'was', 'were', 'not', 'but',
            'so', 'if', 'or', 'from', 'at', 'as', 'do', 'did', 'done', 'going', 'here',
            'there', 'when', 'where', 'who', 'why', 'good', 'morning', 'night', 'see',
            'later', 'today', 'tomorrow', 'yeah', 'yep', 'nope', 'sure', 'great',
        ];
        $markerSet = array_flip($markers);
        $hits = 0;
        foreach ($words as $word) {
            if (isset($markerSet[$word])) {
                $hits++;
            }
        }

        if (count($words) <= 4) {
            return $hits >= 1;
        }

        return ($hits / count($words)) >= 0.25;
    }

    /**
     * @return array<string, string>
     */
    public static function countryMap(): array
    {
        return [
            'US' => 'en', 'GB' => 'en', 'AU' => 'en', 'NZ' => 'en', 'IE' => 'en',
            'CA' => 'en', 'ZA' => 'en', 'NG' => 'en', 'KE' => 'en', 'GH' => 'en',
            'SG' => 'en', 'PH' => 'en', 'JM' => 'en', 'TT' => 'en', 'BZ' => 'en',
            'IL' => 'he',
            'ES' => 'es', 'MX' => 'es', 'AR' => 'es', 'CO' => 'es', 'CL' => 'es',
            'PE' => 'es', 'VE' => 'es', 'EC' => 'es', 'GT' => 'es', 'CU' => 'es',
            'BO' => 'es', 'DO' => 'es', 'HN' => 'es', 'PY' => 'es', 'SV' => 'es',
            'NI' => 'es', 'CR' => 'es', 'UY' => 'es', 'PA' => 'es', 'PR' => 'es',
            'FR' => 'fr', 'BE' => 'fr', 'LU' => 'fr', 'MC' => 'fr', 'SN' => 'fr',
            'CI' => 'fr', 'ML' => 'fr', 'CM' => 'fr', 'CD' => 'fr', 'MG' => 'fr',
            'SA' => 'ar', 'AE' => 'ar', 'EG' => 'ar', 'JO' => 'ar', 'IQ' => 'ar',
            'KW' => 'ar', 'QA' => 'ar', 'BH' => 'ar', 'OM' => 'ar', 'LY' => 'ar',
            'DZ' => 'ar', 'MA' => 'ar', 'TN' => 'ar', 'YE' => 'ar', 'SD' => 'ar',
            'SY' => 'ar', 'LB' => 'ar', 'PS' => 'ar',
            'DE' => 'de', 'AT' => 'de', 'CH' => 'de', 'LI' => 'de',
            'BR' => 'pt', 'PT' => 'pt', 'AO' => 'pt', 'MZ' => 'pt',
            'RU' => 'ru', 'BY' => 'ru', 'KZ' => 'ru',
            'UA' => 'uk',
            'CN' => 'zh', 'TW' => 'zh', 'HK' => 'zh',
            'JP' => 'ja',
            'KR' => 'ko',
            'IN' => 'hi',
            'IT' => 'it',
            'NL' => 'nl',
            'PL' => 'pl',
            'TR' => 'tr',
            'TH' => 'th',
            'VN' => 'vi',
            'ID' => 'id',
            'IR' => 'fa',
            'GR' => 'el',
            'SE' => 'sv',
            'NO' => 'no',
            'DK' => 'da',
            'FI' => 'fi',
            'CZ' => 'cs',
            'RO' => 'ro',
            'HU' => 'hu',
            'PK' => 'ur',
            'BD' => 'bn',
        ];
    }

    /**
     * Longest prefixes first so +972 wins over shorter matches.
     *
     * @return array<string, string>
     */
    public static function phonePrefixes(): array
    {
        return [
            '+970' => 'PS', '+971' => 'AE', '+972' => 'IL', '+973' => 'BH',
            '+974' => 'QA', '+966' => 'SA', '+968' => 'OM', '+965' => 'KW',
            '+964' => 'IQ', '+963' => 'SY', '+962' => 'JO', '+961' => 'LB',
            '+886' => 'TW', '+880' => 'BD', '+852' => 'HK', '+420' => 'CZ',
            '+421' => 'SK', '+359' => 'BG', '+358' => 'FI', '+353' => 'IE',
            '+351' => 'PT', '+380' => 'UA', '+385' => 'HR', '+386' => 'SI',
            '+381' => 'RS', '+249' => 'SD', '+218' => 'LY', '+216' => 'TN',
            '+213' => 'DZ', '+212' => 'MA', '+98' => 'IR', '+90' => 'TR',
            '+86' => 'CN', '+84' => 'VN', '+82' => 'KR', '+81' => 'JP',
            '+66' => 'TH', '+65' => 'SG', '+63' => 'PH', '+62' => 'ID',
            '+61' => 'AU', '+60' => 'MY', '+55' => 'BR', '+54' => 'AR',
            '+52' => 'MX', '+51' => 'PE', '+49' => 'DE', '+48' => 'PL',
            '+47' => 'NO', '+46' => 'SE', '+45' => 'DK', '+44' => 'GB',
            '+39' => 'IT', '+36' => 'HU', '+34' => 'ES', '+33' => 'FR',
            '+31' => 'NL', '+30' => 'GR', '+27' => 'ZA', '+20' => 'EG',
            '+7' => 'RU', '+1' => 'US',
        ];
    }
}
