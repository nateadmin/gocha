import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nManager } from 'react-native';

import { useAuth } from '../context/AuthContext';
import {
  DEFAULT_LANGUAGE,
  detectLanguage,
  isRtlLanguage,
  LANGUAGE_OPTIONS,
  normalizeLanguage,
  type AppLanguageCode,
  type LanguageOption,
} from './languages';
import { translate, type StringKey } from './strings';

type LanguageContextValue = {
  language: AppLanguageCode;
  rtl: boolean;
  options: LanguageOption[];
  t: (key: StringKey) => string;
  setLanguage: (code: AppLanguageCode) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyDocumentLocale(code: AppLanguageCode): void {
  const rtl = isRtlLanguage(code);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }
  try {
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  } catch {
    // Native RTL flip can require a reload; web uses document.dir.
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [guestLanguage, setGuestLanguage] = useState<AppLanguageCode>(() => detectLanguage());

  const language =
    normalizeLanguage(user?.language) ?? guestLanguage ?? DEFAULT_LANGUAGE;
  const rtl = isRtlLanguage(language);

  useEffect(() => {
    applyDocumentLocale(language);
  }, [language]);

  const setLanguage = useCallback((code: AppLanguageCode) => {
    const next = normalizeLanguage(code) ?? DEFAULT_LANGUAGE;
    setGuestLanguage(next);
    applyDocumentLocale(next);
  }, []);

  const t = useCallback((key: StringKey) => translate(language, key), [language]);

  const value = useMemo(
    () => ({
      language,
      rtl,
      options: LANGUAGE_OPTIONS,
      t,
      setLanguage,
    }),
    [language, rtl, t, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
