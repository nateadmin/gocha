/**
 * Neon Cyber brand tokens (native: system UI fonts).
 */
import {
  darkColors,
  lightColors,
  neonShadowStyle,
  PRIMARY,
  radii,
  spacing,
  uiMonoFamily,
  uiSansFamily,
  type GochaTheme,
  type ThemeMode,
  type ThemeTypography,
} from './palette';

export type {
  GochaTheme,
  ThemeColors,
  ThemeMode,
  ThemeRadii,
  ThemeShadow,
  ThemeSpacing,
  ThemeTypography,
} from './palette';

export {
  darkColors,
  lightColors,
  neonShadowStyle,
  spacing,
} from './palette';

const traditionalTypography: ThemeTypography = {
  sans: uiSansFamily,
  serif: uiSansFamily,
  mono: uiMonoFamily,
  letterSpacing: 0,
  title: 28,
  body: 16,
  caption: 13,
  label: 12,
};

export const lightTheme: GochaTheme = {
  mode: 'light',
  colors: lightColors,
  radius: 0,
  radii,
  shadow: {
    color: PRIMARY,
    offsetX: 0,
    offsetY: 0,
    blur: 12,
    spread: 2,
    opacity: 0.25,
  },
  typography: traditionalTypography,
  spacing,
};

export const darkTheme: GochaTheme = {
  mode: 'dark',
  colors: darkColors,
  radius: 0,
  radii,
  shadow: {
    color: PRIMARY,
    offsetX: 0,
    offsetY: 0,
    blur: 20,
    spread: 4,
    opacity: 0.6,
  },
  typography: traditionalTypography,
  spacing,
};

export function themeForMode(mode: ThemeMode): GochaTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
