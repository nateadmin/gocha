import { useFonts } from 'expo-font';
import {
  Rajdhani_400Regular,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import { FiraCode_400Regular } from '@expo-google-fonts/fira-code';
import { Orbitron_400Regular } from '@expo-google-fonts/orbitron';

export const brandFontFamilies = {
  rajdhaniRegular: 'Rajdhani_400Regular',
  rajdhaniSemiBold: 'Rajdhani_600SemiBold',
  rajdhaniBold: 'Rajdhani_700Bold',
  firaCodeRegular: 'FiraCode_400Regular',
  orbitronRegular: 'Orbitron_400Regular',
} as const;

export function useBrandFonts(): { ready: boolean } {
  const [loaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    FiraCode_400Regular,
    Orbitron_400Regular,
  });

  return { ready: loaded };
}
