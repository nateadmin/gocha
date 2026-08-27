import { View, type ViewProps, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

type Props = ViewProps & {
  padded?: boolean;
};

export function BrandCard({ padded = true, style, children, ...props }: Props) {
  const { theme } = useGochaTheme();
  const { colors, radius, spacing } = theme;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius,
          padding: padded ? spacing.section : 0,
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 12,
  },
});
