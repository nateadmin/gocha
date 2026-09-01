import { View, StyleSheet } from 'react-native';

import { useGochaTheme } from '../../theme';

export const UNREAD_DOT_SIZE = 10;
export const UNREAD_DOT_BORDER_WIDTH = 2;

type Props = {
  borderColor?: string;
};

export function UnreadDot({ borderColor }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: theme.colors.accent,
          borderColor: borderColor ?? theme.colors.card,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: UNREAD_DOT_SIZE,
    height: UNREAD_DOT_SIZE,
    borderRadius: UNREAD_DOT_SIZE / 2,
    borderWidth: UNREAD_DOT_BORDER_WIDTH,
  },
});
