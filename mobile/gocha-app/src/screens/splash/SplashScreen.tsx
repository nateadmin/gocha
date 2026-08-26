import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { BrandLogo } from '../../components/brand/BrandLogo';
import { BrandText } from '../../components/brand/BrandText';
import { UniversalLoader } from '../../components/app/UniversalLoader';
import { useGochaTheme } from '../../theme';

const MIN_SPLASH_MS = 1600;

export function SplashScreen() {
  const { theme } = useGochaTheme();
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTagline(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      accessibilityLabel="Gotcha is loading">
      <View style={styles.glow} />
      <View style={styles.content}>
        <BrandLogo size={96} />
        <BrandText variant="display" style={styles.title}>Gotcha</BrandText>
        <BrandText
          variant="caption"
          muted
          style={[styles.tagline, { opacity: showTagline ? 1 : 0 }]}>
          Connect. Catch up. Discover.
        </BrandText>
        <View style={styles.loaderWrap}>
          <UniversalLoader size={0.85} />
        </View>
      </View>
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
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#1B00D8',
    opacity: 0.12,
    top: '28%',
  },
  content: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 12,
    fontSize: 40,
    letterSpacing: 1,
  },
  tagline: {
    marginBottom: 28,
  },
  loaderWrap: {
    marginTop: 8,
  },
});
