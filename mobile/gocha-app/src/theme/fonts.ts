import {
  uiMonoFamily,
  uiSansFamily,
} from './typographyFamilies';

export const brandFontFamilies = {
  uiSans: uiSansFamily,
  uiMono: uiMonoFamily,
} as const;

/** System fonts need no async loading. */
export function useBrandFonts(): { ready: boolean } {
  return { ready: true };
}
