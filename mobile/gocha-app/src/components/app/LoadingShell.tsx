import { View, StyleSheet } from 'react-native';

import { BrandText } from '../brand/BrandText';
import { useGochaTheme } from '../../theme';
import { UniversalLoader } from './UniversalLoader';

type Props = {
  label?: string;
  loaderSize?: number;
};

export function LoadingShell({ label, loaderSize = 1 }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View
      style={[styles.shell, { backgroundColor: theme.colors.background }]}
      accessibilityLabel={label ?? 'Loading'}>
      <UniversalLoader size={loaderSize} />
      {label ? (
        <BrandText muted style={styles.label}>{label}</BrandText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  label: {
    textAlign: 'center',
  },
});
