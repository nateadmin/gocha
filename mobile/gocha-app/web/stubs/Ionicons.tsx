import { Text, type StyleProp, type TextStyle } from 'react-native';

/** Web preview icon stub (avoids @expo/vector-icons JSX in production builds). */
export const glyphMap = {
  'radio-button-on': 0,
  'camera-outline': 0,
  'create-outline': 0,
  'chevron-forward': 0,
  'shield-checkmark-outline': 0,
  'person-outline': 0,
  'notifications-outline': 0,
  'chatbox-outline': 0,
  'volume-medium-outline': 0,
  'sparkles': 0,
  'lock-closed-outline': 0,
  'refresh': 0,
  'calendar-outline': 0,
  'location': 0,
  'chevron-down': 0,
  'search': 0,
  'chevron-back': 0,
  'time-outline': 0,
  'car-outline': 0,
  'location-outline': 0,
  'add': 0,
  'pin': 0,
  'storefront-outline': 0,
  'chatbubble-outline': 0,
  'sparkles-outline': 0,
  'compass-outline': 0,
  'call-outline': 0,
  'settings-outline': 0,
  'arrow-down': 0,
  'arrow-up': 0,
  'send': 0,
  'checkmark-done': 0,
  'image-outline': 0,
  'mic-outline': 0,
  'information-circle-outline': 0,
} as const;

const GLYPHS: Record<string, string> = {
  'radio-button-on': '●',
  'camera-outline': '⌁',
  'create-outline': '✎',
  'chevron-forward': '›',
  'shield-checkmark-outline': '⛨',
  'person-outline': '👤',
  'notifications-outline': '🔔',
  'chatbox-outline': '💬',
  'volume-medium-outline': '🔊',
  'sparkles': '✦',
  'lock-closed-outline': '🔒',
  'refresh': '↻',
  'calendar-outline': '📅',
  'location': '⌖',
  'chevron-down': '▾',
  'search': '⌕',
  'chevron-back': '‹',
  'time-outline': '⏱',
  'car-outline': '🚗',
  'location-outline': '📍',
  'add': '+',
  'pin': '📌',
  'storefront-outline': '🏪',
  'chatbubble-outline': '💬',
  'sparkles-outline': '✦',
  'compass-outline': '◎',
  'call-outline': '📞',
  'settings-outline': '⚙',
  'arrow-down': '↓',
  'arrow-up': '↑',
  'send': '➤',
  'checkmark-done': '✓',
  'image-outline': '🖼',
  'mic-outline': '🎤',
  'information-circle-outline': 'ℹ',
};

type Props = {
  name: keyof typeof glyphMap | string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

function Ionicons({ name, size = 24, color = '#000', style }: Props) {
  const glyph = GLYPHS[name] ?? '·';
  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size,
          color,
          width: size,
          textAlign: 'center',
        },
        style,
      ]}>
      {glyph}
    </Text>
  );
}

export default Ionicons;
