import { Pressable, View, StyleSheet } from 'react-native';

import { BrandLogo } from '../brand';
import { useGochaTheme } from '../../theme';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  logoSize?: number;
  showBadge?: boolean;
};

export function AccountLogoButton({
  onPress,
  accessibilityLabel = 'Switch account',
  logoSize = 40,
  showBadge = false,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.button}>
      <View style={{ width: logoSize, height: logoSize }}>
        <BrandLogo size={logoSize} />
        {showBadge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.accent,
                borderColor: theme.colors.background,
              },
            ]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
