import { useFonts } from 'expo-font';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';

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

export function useBrandFonts(): { ready: boolean } {
  const [loaded] = useFonts({
    Rajdhani_600SemiBold,
  });

  return { ready: loaded };
}
