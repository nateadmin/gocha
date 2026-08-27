import { Image, type ImageStyle, StyleSheet } from 'react-native';

import { brandLogoSource } from '../../branding/logo';

type Props = {
  size?: number;
  style?: ImageStyle;
  accessibilityLabel?: string;
};

export function BrandLogo({
  size = 56,
  style,
  accessibilityLabel = 'Gocha logo',
}: Props) {
  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      pointerEvents="none"
      source={brandLogoSource}
      style={[styles.logo, { width: size, height: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
  },
});
