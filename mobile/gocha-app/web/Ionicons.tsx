import { Text, type StyleProp, type TextStyle } from 'react-native';

import glyphMapJson from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';

/** Ionicons font glyphs for web (same family as native @expo/vector-icons). */
export const glyphMap = glyphMapJson as Record<string, number>;

type IconName = keyof typeof glyphMapJson;

type Props = {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

function Ionicons({ name, size = 24, color = '#000', style }: Props) {
  const code = glyphMap[name as IconName];
  if (code == null) {
    return <Text style={{ width: size, height: size }} />;
  }

  return (
    <Text
      style={[
        {
          fontFamily: 'ionicons',
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
