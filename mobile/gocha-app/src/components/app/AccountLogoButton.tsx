import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BrandLogo } from '../brand';
import { useGochaTheme } from '../../theme';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  logoSize?: number;
};

export function AccountLogoButton({
  onPress,
  accessibilityLabel = 'Switch account',
  logoSize = 40,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.button}>
      <BrandLogo size={logoSize} />
      <Ionicons name="chevron-down" size={14} color={theme.colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
