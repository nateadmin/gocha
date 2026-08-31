export type AppLanguageCode =
  | 'en'
  | 'he'
  | 'es'
  | 'fr'
  | 'ar'
  | 'ru'
  | 'de'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'hi'
  | 'it'
  | 'nl'
  | 'pl'
  | 'tr'
  | 'uk'
  | 'vi'
  | 'th'
  | 'id'
  | 'fa'
  | 'el'
  | 'sv'
  | 'no'
  | 'da'
  | 'fi'
  | 'cs'
  | 'ro'
  | 'hu'
  | 'ur'
  | 'bn';

export type LanguageOption = {
  code: AppLanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean;
};

export const DEFAULT_LANGUAGE: AppLanguageCode = 'en';

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', rtl: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', rtl: false },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', rtl: false },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', rtl: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false },
];

const LANGUAGE_SET = new Set(LANGUAGE_OPTIONS.map((option) => option.code));

const COUNTRY_LANGUAGE: Record<string, AppLanguageCode> = {
  US: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en', CA: 'en', ZA: 'en',
  NG: 'en', KE: 'en', GH: 'en', SG: 'en', PH: 'en', JM: 'en', TT: 'en',
  IL: 'he',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', UY: 'es', PA: 'es', PR: 'es',
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', ML: 'fr',
  SA: 'ar', AE: 'ar', EG: 'ar', JO: 'ar', IQ: 'ar', KW: 'ar', QA: 'ar',
  BH: 'ar', OM: 'ar', LY: 'ar', DZ: 'ar', MA: 'ar', TN: 'ar', YE: 'ar',
  SD: 'ar', SY: 'ar', LB: 'ar', PS: 'ar',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  RU: 'ru', BY: 'ru', KZ: 'ru',
  UA: 'uk', CN: 'zh', TW: 'zh', HK: 'zh', JP: 'ja', KR: 'ko', IN: 'hi',
  IT: 'it', NL: 'nl', PL: 'pl', TR: 'tr', TH: 'th', VN: 'vi', ID: 'id',
  IR: 'fa', GR: 'el', SE: 'sv', NO: 'no', DK: 'da', FI: 'fi', CZ: 'cs',
  RO: 'ro', HU: 'hu', PK: 'ur', BD: 'bn',
};

const TIMEZONE_COUNTRY: Record<string, string> = {
  'Asia/Jerusalem': 'IL',
  'Asia/Hebron': 'PS',
  'Asia/Gaza': 'PS',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Santiago': 'CL',
  'America/Lima': 'PE',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Warsaw': 'PL',
  'Europe/Moscow': 'RU',
  'Europe/Kyiv': 'UA',
  'Europe/Istanbul': 'TR',
  'Europe/Athens': 'GR',
  'Europe/Stockholm': 'SE',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Africa/Cairo': 'EG',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Singapore': 'SG',
  'Asia/Kolkata': 'IN',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Tehran': 'IR',
  'Australia/Sydney': 'AU',
  'Pacific/Auckland': 'NZ',
};

const LANGUAGE_ALIASES: Record<string, AppLanguageCode> = {
  iw: 'he',
  in: 'id',
  nb: 'no',
  nn: 'no',
};

export function normalizeLanguage(code: string | null | undefined): AppLanguageCode | null {
  if (!code) return null;
  const base = code.trim().toLowerCase().replace('_', '-').split('-')[0] ?? '';
  const aliased = LANGUAGE_ALIASES[base] ?? base;
  return LANGUAGE_SET.has(aliased as AppLanguageCode) ? (aliased as AppLanguageCode) : null;
}

export function languageForCountry(country: string | null | undefined): AppLanguageCode | null {
  if (!country) return null;
  return COUNTRY_LANGUAGE[country.trim().toUpperCase()] ?? null;
}

export function isRtlLanguage(code: string | null | undefined): boolean {
  const normalized = normalizeLanguage(code);
  return LANGUAGE_OPTIONS.some((option) => option.code === normalized && option.rtl);
}

export function languageLabel(code: string | null | undefined): string {
  const normalized = normalizeLanguage(code) ?? DEFAULT_LANGUAGE;
  const option = LANGUAGE_OPTIONS.find((entry) => entry.code === normalized);
  return option ? option.nativeName : 'English';
}

export function detectCountryCode(): string | null {
  if (typeof Intl !== 'undefined') {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone && TIMEZONE_COUNTRY[timeZone]) {
        return TIMEZONE_COUNTRY[timeZone];
      }
    } catch {
      // Ignore missing Intl timezone support.
    }
  }

  const locale = readNavigatorLocale();
  if (locale) {
    const region = locale.split(/[-_]/)[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) {
      return region.toUpperCase();
    }
  }

  return null;
}

export function detectLanguage(): AppLanguageCode {
  const locale = readNavigatorLocale();
  const fromLocale = normalizeLanguage(locale);
  if (fromLocale) {
    return fromLocale;
  }

  return languageForCountry(detectCountryCode()) ?? DEFAULT_LANGUAGE;
}

export function detectSignupLocale(): { language: AppLanguageCode; country: string | null } {
  const country = detectCountryCode();
  const locale = readNavigatorLocale();
  const language =
    normalizeLanguage(locale) ?? languageForCountry(country) ?? DEFAULT_LANGUAGE;

  return { language, country };
}

function readNavigatorLocale(): string | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  return navigator.language || navigator.languages?.[0] || null;
}
