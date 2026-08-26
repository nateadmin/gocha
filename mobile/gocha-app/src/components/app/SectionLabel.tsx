import { Text, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

type Props = {
  children: string;
};

export function SectionLabel({ children }: Props) {
  const { theme } = useGochaTheme();

  return (
    <Text
      style={[
        styles.label,
        {
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          letterSpacing: theme.typography.letterSpacing * 0.5,
        },
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
