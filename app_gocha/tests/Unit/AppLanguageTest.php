<?php

namespace Tests\Unit;

use App\Support\AppLanguage;
use PHPUnit\Framework\TestCase;

class AppLanguageTest extends TestCase
{
    public function test_us_and_israel_map_to_english_and_hebrew(): void
    {
        $this->assertSame('en', AppLanguage::forCountry('US'));
        $this->assertSame('en', AppLanguage::forCountry('us'));
        $this->assertSame('he', AppLanguage::forCountry('IL'));
        $this->assertSame('es', AppLanguage::forCountry('MX'));
        $this->assertSame('ar', AppLanguage::forCountry('SA'));
    }

    public function test_phone_prefixes_resolve_country(): void
    {
        $this->assertSame('IL', AppLanguage::countryFromPhone('+972501234567'));
        $this->assertSame('US', AppLanguage::countryFromPhone('+15551234567'));
        $this->assertSame('GB', AppLanguage::countryFromPhone('+447911123456'));
    }

    public function test_resolve_prefers_explicit_language_then_country_then_phone(): void
    {
        $this->assertSame('es', AppLanguage::resolve('es', 'IL', '+972501234567', 'US'));
        $this->assertSame('he', AppLanguage::resolve(null, 'IL', '+15551234567', 'US'));
        $this->assertSame('he', AppLanguage::resolve(null, null, '+972501234567', 'US'));
        $this->assertSame('en', AppLanguage::resolve(null, null, null, 'US'));
        $this->assertSame('en', AppLanguage::resolve(null, null, null, null));
    }

    public function test_normalize_accepts_aliases_and_regions(): void
    {
        $this->assertSame('he', AppLanguage::normalize('iw'));
        $this->assertSame('he', AppLanguage::normalize('he-IL'));
        $this->assertSame('en', AppLanguage::normalize('en-US'));
        $this->assertNull(AppLanguage::normalize('xx'));
    }

    public function test_script_detection_and_english_heuristic(): void
    {
        $this->assertSame('he', AppLanguage::detectScriptLanguage('שלום מה נשמע'));
        $this->assertSame('ar', AppLanguage::detectScriptLanguage('مرحبا'));
        $this->assertNull(AppLanguage::detectScriptLanguage('Hey Bob'));
        $this->assertTrue(AppLanguage::looksLikeEnglish('Hey Bob'));
        $this->assertTrue(AppLanguage::looksLikeEnglish('Are we still on for Friday dinner?'));
        $this->assertFalse(AppLanguage::looksLikeEnglish('Bonjour comment ca va aujourd hui'));
    }
}
