import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import glyphMapJson from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';

import { ioniconsFamily } from '../theme/typographyFamilies';

/**
 * Drop-in replacement for `@expo/vector-icons/Ionicons`.
 *
 * The Expo icon set loads its font through `expo-font`, whose native module
 * (`ExpoFontLoader`) only exists once the Expo modules runtime is linked. This
 * is a bare React Native app, so that module is missing and importing the Expo
 * icon set crashes on launch. The font is bundled with the native app instead
 * (see `android/app/src/main/assets/fonts`), which needs no native module at
 * all, so we only borrow the glyph map and render it as text.
 *
 * Metro and Vite both alias `@expo/vector-icons/Ionicons` here, so call sites
 * keep importing the familiar path.
 */
export const glyphMap = glyphMapJson;

export type IoniconName = keyof typeof glyphMap;

type Props = Omit<TextProps, 'style'> & {
  name: IoniconName | string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

function Ionicons({ name, size = 24, color = '#000', style, ...rest }: Props) {
  const code = glyphMap[name as IoniconName];

  // Unknown glyph: keep the layout slot so icon rows do not reflow.
  if (code == null) {
    return <Text style={{ width: size, height: size }} />;
  }

  return (
    <Text
      accessible={false}
      // Icon glyphs are sized in layout units; scaling them breaks alignment.
      allowFontScaling={false}
      selectable={false}
      {...rest}
      style={[
        {
          fontFamily: ioniconsFamily,
          fontSize: size,
          lineHeight: size,
          color,
          width: size,
          textAlign: 'center',
        },
        style,
      ]}>
      {String.fromCodePoint(code)}
    </Text>
  );
}

export default Object.assign(Ionicons, { glyphMap });
