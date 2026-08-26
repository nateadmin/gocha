/**
 * Neon Cyber brand tokens (qprofile / Quentin Casares).
 * Primary brand color: #1B00D8 (both modes).
 */
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  popover: string;
  popoverForeground: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeShadow {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  opacity: number;
}

export interface ThemeTypography {
  sans: string;
  serif: string;
  mono: string;
  letterSpacing: number;
  title: number;
  body: number;
  caption: number;
  label: number;
}

export interface ThemeSpacing {
  unit: number;
  screen: number;
  section: number;
  stack: number;
}

export interface GochaTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  radius: number;
  shadow: ThemeShadow;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}

const PRIMARY = '#1B00D8';

export const lightColors: ThemeColors = {
  background: '#f6f4fb',
  foreground: '#00734a',
  card: '#ffffff',
  cardForeground: '#16121f',
  primary: PRIMARY,
  primaryForeground: '#ffffff',
  secondary: '#00669c',
  secondaryForeground: '#ffffff',
  muted: '#ece8f4',
  mutedForeground: '#5c5670',
  accent: '#c4003f',
  accentForeground: '#ffffff',
  destructive: '#c4002e',
  destructiveForeground: '#ffffff',
  border: '#d8d2e6',
  input: '#ffffff',
  ring: PRIMARY,
  popover: '#ffffff',
  popoverForeground: '#00734a',
  chart1: PRIMARY,
  chart2: '#00734a',
  chart3: '#00669c',
  chart4: '#c4003f',
  chart5: '#7a7f00',
};

export const darkColors: ThemeColors = {
  background: '#0d0221',
  foreground: '#00ff9f',
  card: '#1a1b2e',
  cardForeground: '#f0f0f0',
  primary: PRIMARY,
  primaryForeground: '#ffffff',
  secondary: '#00b8ff',
  secondaryForeground: '#04121c',
  muted: '#262635',
  mutedForeground: '#888899',
  accent: '#ff0055',
  accentForeground: '#ffffff',
  destructive: '#ff003c',
  destructiveForeground: '#ffffff',
  border: '#3d3d5c',
  input: '#1a1b2e',
  ring: PRIMARY,
  popover: '#1a1b2e',
  popoverForeground: '#00ff9f',
  chart1: PRIMARY,
  chart2: '#00ff9f',
  chart3: '#00b8ff',
  chart4: '#ff0055',
  chart5: '#f7ff00',
};

const lightTypography: ThemeTypography = {
  sans: 'Rajdhani_600SemiBold',
  serif: 'Rajdhani_600SemiBold',
  mono: 'FiraCode_400Regular',
  letterSpacing: 0.1 * 16,
  title: 28,
  body: 16,
  caption: 13,
  label: 12,
};

const darkTypography: ThemeTypography = {
  sans: 'Rajdhani_600SemiBold',
  serif: 'Orbitron_400Regular',
  mono: 'FiraCode_400Regular',
  letterSpacing: 0.15 * 16,
  title: 28,
  body: 16,
  caption: 13,
  label: 12,
};

const spacing: ThemeSpacing = {
  unit: 4,
  screen: 20,
  section: 16,
  stack: 12,
};

export const lightTheme: GochaTheme = {
  mode: 'light',
  colors: lightColors,
  radius: 0,
  shadow: {
    color: PRIMARY,
    offsetX: 0,
    offsetY: 0,
    blur: 12,
    spread: 2,
    opacity: 0.25,
  },
  typography: lightTypography,
  spacing,
};

export const darkTheme: GochaTheme = {
  mode: 'dark',
  colors: darkColors,
  radius: 0,
  shadow: {
    color: PRIMARY,
    offsetX: 0,
    offsetY: 0,
    blur: 20,
    spread: 4,
    opacity: 0.6,
  },
  typography: darkTypography,
  spacing,
};

export function themeForMode(mode: ThemeMode): GochaTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export function neonShadowStyle(theme: GochaTheme) {
  const { shadow } = theme;
  return {
    shadowColor: shadow.color,
    shadowOffset: { width: shadow.offsetX, height: shadow.offsetY },
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.blur,
    elevation: Math.max(4, shadow.spread),
  };
}
