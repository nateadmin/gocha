import {
  Pressable,
  Text,
  type PressableProps,
  StyleSheet,
} from 'react-native';

import { UniversalLoader } from '../app/UniversalLoader';
import { neonShadowStyle, useGochaTheme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'destructive';

/**
 * Standard button for secondary actions. Use CtaButton for large primary CTAs
 * (sign up, create business, join flows).
 */

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

export function BrandButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: Props) {
  const { theme } = useGochaTheme();
  const { colors, radius, typography } = theme;

  const palette = (() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          textColor: colors.secondaryForeground,
          borderColor: colors.secondary,
          glow: false,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
          borderColor: colors.primary,
          glow: false,
        };
      case 'destructive':
        return {
          backgroundColor: colors.destructive,
          textColor: colors.destructiveForeground,
          borderColor: colors.destructive,
          glow: false,
        };
      default:
        return {
          backgroundColor: colors.primary,
          textColor: colors.primaryForeground,
          borderColor: colors.primary,
          glow: true,
        };
    }
  })();

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderRadius: radius,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
        },
        palette.glow ? neonShadowStyle(theme) : null,
        style,
      ]}
      {...props}>
      {loading ? (
        <UniversalLoader size={0.28} />
      ) : (
        <Text
          style={{
            color: palette.textColor,
            fontFamily: typography.sans,
            fontSize: typography.body,
            letterSpacing: typography.letterSpacing,
          }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
