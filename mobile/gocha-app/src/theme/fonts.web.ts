import {
  webUiMonoFamily,
  webUiSansFamily,
} from './typographyFamilies';

export const brandFontFamilies = {
  uiSans: webUiSansFamily,
  uiMono: webUiMonoFamily,
} as const;

export function useBrandFonts(): { ready: boolean } {
  return { ready: true };
}
