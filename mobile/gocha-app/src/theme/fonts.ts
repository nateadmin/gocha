import {
  nativeCtaFamily,
  uiMonoFamily,
  uiSansFamily,
} from './typographyFamilies';

export const brandFontFamilies = {
  uiSans: uiSansFamily,
  uiMono: uiMonoFamily,
  cta: nativeCtaFamily,
} as const;

/**
 * Brand fonts ship inside the native app rather than loading at runtime, so
 * they are usable on first render and never gate the splash screen.
 *
 * This used to call expo-font's `useFonts`, whose ExpoFontLoader native module
 * does not exist in this bare React Native app, crashing Android after sign-in.
 * Web still loads Rajdhani over CSS.
 */
export function useBrandFonts(): { ready: boolean } {
  return { ready: true };
}
