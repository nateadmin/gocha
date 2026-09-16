import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useGochaTheme } from '../../theme';

type Props = {
  label?: string;
};

function TypingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

export function TypingIndicator({ label }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View style={styles.row}>
      <View style={styles.wrap}>
        {label ? (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
              marginBottom: 4,
              paddingHorizontal: 4,
            }}>
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radii.card,
            },
          ]}>
          <View style={styles.dots}>
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  wrap: {
    maxWidth: '82%',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 42,
    minHeight: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8b86a8',
  },
});
