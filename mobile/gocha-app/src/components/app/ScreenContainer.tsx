import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGochaTheme } from '../../theme';

type Props = ViewProps & {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function ScreenContainer({
  children,
  style,
  edges = ['top', 'left', 'right'],
  ...props
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}
      {...props}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenBody({ children, style, ...props }: ViewProps) {
  const { theme } = useGochaTheme();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radii.card },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}
