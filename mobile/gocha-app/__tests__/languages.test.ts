import {
  detectSignupLocale,
  languageForCountry,
  normalizeLanguage,
} from '../src/i18n/languages';
import { translate } from '../src/i18n/strings';

describe('languages', () => {
  it('maps US and Israel to English and Hebrew', () => {
    expect(languageForCountry('US')).toBe('en');
    expect(languageForCountry('IL')).toBe('he');
    expect(languageForCountry('MX')).toBe('es');
  });

  it('normalizes region tags and aliases', () => {
    expect(normalizeLanguage('he-IL')).toBe('he');
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('iw')).toBe('he');
    expect(normalizeLanguage('xx')).toBeNull();
  });

  it('detects signup language from navigator locale', () => {
    const original = navigator.language;
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'he-IL' });
    expect(detectSignupLocale().language).toBe('he');
    Object.defineProperty(navigator, 'language', { configurable: true, value: original });
  });

  it('falls back English chrome for untranslated UI languages', () => {
    expect(translate('th', 'settings.language')).toBe('Language');
    expect(translate('he', 'settings.language')).toBe('שפה');
    expect(translate('he', 'chat.showOriginal')).toBe('הצג מקור');
  });
});
