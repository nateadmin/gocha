/**
 * Web preview tokens (system UI font stack).
 */
import {
  darkColors,
  lightColors,
  neonShadowStyle,
  PRIMARY,
  radii,
  spacing,
  webUiMonoFamily,
  webUiSansFamily,
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

const webTypography: ThemeTypography = {
  sans: webUiSansFamily,
  serif: webUiSansFamily,
  mono: webUiMonoFamily,
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
  typography: webTypography,
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
  typography: webTypography,
  spacing,
};

export function themeForMode(mode: ThemeMode): GochaTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
