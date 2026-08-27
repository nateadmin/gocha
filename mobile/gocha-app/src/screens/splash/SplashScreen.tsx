import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { UniversalLoader } from '../../components/app/UniversalLoader';
import { useGochaTheme } from '../../theme';

const MIN_SPLASH_MS = 1400;

export function SplashScreen() {
  const { theme } = useGochaTheme();

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      accessibilityLabel="Loading">
      <UniversalLoader size={1} />
    </View>
  );
}

export function useSplashGate(ready: boolean, minDurationMs = MIN_SPLASH_MS): boolean {
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), minDurationMs);
    return () => clearTimeout(timer);
  }, [minDurationMs]);

  return ready && minElapsed;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
