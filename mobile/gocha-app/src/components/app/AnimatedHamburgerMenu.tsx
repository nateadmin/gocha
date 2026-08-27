import { Pressable, View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  open: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  strokeColor?: string;
  size?: number;
  style?: ViewStyle;
};

export function AnimatedHamburgerMenu({
  open,
  onPress,
  accessibilityLabel = 'Open menu',
  strokeColor = '#00b8ff',
  size = 48,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={open ? 'close' : 'menu'} size={28} color={strokeColor} />
    </Pressable>
  );
}
