import { Platform } from 'react-native';

/** Traditional system UI fonts (San Francisco / Roboto). */
export const uiSansFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
}) as string;

export const uiMonoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

/** Web CSS font stack for react-native-web. */
export const webUiSansFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const webUiMonoFamily =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/**
 * Rajdhani for primary CTA labels (Neon Cyber UI accent).
 *
 * The font ships inside the native app. Android names it after the bundled
 * file, while iOS uses the font's PostScript name.
 */
export const nativeCtaFamily = Platform.select({
  ios: 'Rajdhani-SemiBold',
  android: 'Rajdhani_600SemiBold',
  default: 'Rajdhani_600SemiBold',
}) as string;

/** Bundled Ionicons glyph font; web loads the same face over CSS. */
export const ioniconsFamily = Platform.select({
  web: 'ionicons',
  default: 'Ionicons',
}) as string;

export const webCtaFamily =
  'Rajdhani, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
