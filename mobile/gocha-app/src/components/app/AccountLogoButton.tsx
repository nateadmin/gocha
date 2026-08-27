import { Pressable, StyleSheet } from 'react-native';

import { BrandLogo } from '../brand';

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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.button}>
      <BrandLogo size={logoSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
