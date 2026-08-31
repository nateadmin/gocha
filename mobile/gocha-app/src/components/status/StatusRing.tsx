import { View, StyleSheet } from 'react-native';

import type { StatusRingTone } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';

type Props = {
  tone: StatusRingTone;
  size: number;
  children: React.ReactNode;
};

export function StatusRing({ tone, size, children }: Props) {
  const { theme } = useGochaTheme();
  const pad = tone ? 3 : 0;
  const borderColor =
    tone === 'unseen' ? theme.colors.primary : tone === 'seen' ? theme.colors.mutedForeground : 'transparent';

  return (
    <View
      style={[
        styles.ring,
        {
          width: size + pad * 2,
          height: size + pad * 2,
          padding: pad,
          borderRadius: (size + pad * 2) / 2,
          borderWidth: tone ? 2 : 0,
          borderColor,
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
