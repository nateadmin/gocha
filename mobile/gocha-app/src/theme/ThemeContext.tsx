import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  darkTheme,
  lightTheme,
  type GochaTheme,
  type ThemeMode,
} from './tokens';
import {
  applyWebThemeShell,
  readStoredThemeMode,
  writeStoredThemeMode,
} from './themeStore';

type ThemeContextValue = {
  theme: GochaTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialMode,
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => initialMode ?? readStoredThemeMode(),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeStoredThemeMode(next);
    applyWebThemeShell(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      writeStoredThemeMode(next);
      applyWebThemeShell(next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyWebThemeShell(mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme;
    return {
      theme,
      mode,
      setMode,
      toggleMode,
    };
  }, [mode, setMode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useGochaTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useGochaTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useThemeStyles<T>(factory: (theme: GochaTheme) => T): T {
  const { theme } = useGochaTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
