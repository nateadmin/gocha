import {
  Pressable,
  Text,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';

import { UniversalLoader } from '../app/UniversalLoader';
import { useGochaTheme } from '../../theme';

const INNER_BG = 'rgb(5, 6, 45)';
const GRADIENT_EDGE = '#5b42f3';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
};

export function CtaButton({
  label,
  loading = false,
  disabled,
  fullWidth = true,
  style,
  ...props
}: Props) {
  const { theme } = useGochaTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        fullWidth && styles.fullWidth,
        {
          opacity: isDisabled ? 0.55 : 1,
          transform: pressed && !isDisabled ? [{ scale: 0.96 }] : undefined,
        },
        style,
      ]}
      {...props}>
      <View
        style={[
          styles.outer,
          {
            backgroundColor: GRADIENT_EDGE,
            shadowColor: '#9741fc',
          },
        ]}>
        <View style={[styles.inner, { backgroundColor: INNER_BG }]}>
          {loading ? (
            <UniversalLoader size={0.28} />
          ) : (
            <Text
              style={{
                color: '#ffffff',
                fontFamily: theme.typography.sans,
                fontSize: 18,
                lineHeight: 18,
                letterSpacing: theme.typography.letterSpacing,
                textAlign: 'center',
              }}>
              {label}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  outer: {
    borderRadius: 8,
    padding: 3,
    minWidth: 140,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  inner: {
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
