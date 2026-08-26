import { Pressable, type PressableProps, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { neonShadowStyle, useGochaTheme } from '../../theme';

type Props = PressableProps & {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'muted';
  size?: number;
  accessibilityLabel?: string;
};

export function IconButton({
  icon,
  tone = 'muted',
  size = 40,
  style,
  accessibilityLabel,
  ...props
}: Props) {
  const { theme } = useGochaTheme();
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: theme.radii.pill,
          backgroundColor: isPrimary ? theme.colors.primary : theme.colors.muted,
        },
        isPrimary ? neonShadowStyle(theme) : null,
        style,
      ]}
      {...props}>
      <Ionicons
        name={icon}
        size={20}
        color={isPrimary ? theme.colors.primaryForeground : theme.colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
