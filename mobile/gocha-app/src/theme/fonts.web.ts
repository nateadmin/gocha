export const brandFontFamilies = {
  rajdhaniRegular: 'Rajdhani',
  rajdhaniSemiBold: 'Rajdhani',
  rajdhaniBold: 'Rajdhani',
  firaCodeRegular: 'Fira Code',
  orbitronRegular: 'Orbitron',
} as const;

/** Web preview uses Google Fonts from web/index.html (no expo-font). */
export function useBrandFonts(): { ready: boolean } {
  return { ready: true };
}
