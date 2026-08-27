import { ActivityIndicator, View } from 'react-native';

import { useGochaTheme } from '../../theme';

type Props = {
  size?: number;
};

export function UniversalLoader({ size = 1 }: Props) {
  const { theme } = useGochaTheme();
  const indicatorSize = size < 0.5 ? 'small' : 'large';

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={{ transform: [{ scale: size }] }}>
      <ActivityIndicator size={indicatorSize} color={theme.colors.primary} />
    </View>
  );
}
