import {
  webCtaFamily,
  webUiMonoFamily,
  webUiSansFamily,
} from './typographyFamilies';

export const brandFontFamilies = {
  uiSans: webUiSansFamily,
  uiMono: webUiMonoFamily,
  cta: webCtaFamily,
} as const;

export function useBrandFonts(): { ready: boolean } {
  return { ready: true };
}
