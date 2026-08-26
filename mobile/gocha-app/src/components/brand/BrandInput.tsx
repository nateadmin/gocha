import { TextInput, type TextInputProps, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

type Props = TextInputProps;

export function BrandInput({ style, placeholderTextColor, ...props }: Props) {
  const { theme } = useGochaTheme();
  const { colors, radius, typography } = theme;

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
      style={[
        styles.input,
        {
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.cardForeground,
          borderRadius: radius,
          fontFamily: typography.sans,
          fontSize: typography.body,
          letterSpacing: typography.letterSpacing,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
