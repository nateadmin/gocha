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
 * Bare React Native has no ExpoFontLoader native module. Waiting on expo-font
 * crashes Android before sign-in. Use system fonts; web still loads Rajdhani via CSS.
 */
export function useBrandFonts(): { ready: boolean } {
  return { ready: true };
}
