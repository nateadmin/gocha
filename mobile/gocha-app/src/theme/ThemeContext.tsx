import React, {
  createContext,
  useContext,
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

type ThemeContextValue = {
  theme: GochaTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialMode = 'dark',
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme;
    return {
      theme,
      mode,
      setMode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    };
  }, [mode]);

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
