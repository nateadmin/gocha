import { View, Text, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

type Tone = 'primary' | 'secondary' | 'accent' | 'destructive';

type Props = {
  label: string;
  tone?: Tone;
};

export function BrandBadge({ label, tone = 'primary' }: Props) {
  const { theme } = useGochaTheme();
  const { colors, radius, typography } = theme;

  const palette = (() => {
    switch (tone) {
      case 'secondary':
        return { bg: colors.secondary, fg: colors.secondaryForeground };
      case 'accent':
        return { bg: colors.accent, fg: colors.accentForeground };
      case 'destructive':
        return { bg: colors.destructive, fg: colors.destructiveForeground };
      default:
        return { bg: colors.primary, fg: colors.primaryForeground };
    }
  })();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderRadius: radius,
        },
      ]}>
      <Text
        style={{
          color: palette.fg,
          fontFamily: typography.sans,
          fontSize: typography.label,
          letterSpacing: typography.letterSpacing,
        }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
