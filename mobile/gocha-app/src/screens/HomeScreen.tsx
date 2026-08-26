import { Image, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BrandBadge,
  BrandButton,
  BrandCard,
  BrandInput,
  BrandScreenTitle,
  BrandText,
} from '../components/brand';
import { API_BASE_URL } from '../config/api';
import { useGochaTheme } from '../theme';

export function HomeScreen() {
  const { theme, mode, toggleMode } = useGochaTheme();
  const { colors, spacing } = theme;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { padding: spacing.screen, gap: spacing.section },
        ]}>
        <View style={styles.headerRow}>
          <Image
            accessibilityLabel="gocha logo"
            source={require('../../assets/branding/logo.jpg')}
            style={styles.logo}
          />
          <BrandBadge label={mode === 'dark' ? 'Dark' : 'Light'} tone="secondary" />
        </View>

        <BrandScreenTitle>gocha</BrandScreenTitle>
        <BrandText muted>
          Neon Cyber brand library. Primary #1B00D8. Tokens and base components
          are wired; product screens ship on top of this layer.
        </BrandText>

        <BrandCard>
          <BrandText variant="label" muted>Planned API host</BrandText>
          <BrandText variant="mono">{API_BASE_URL}</BrandText>
        </BrandCard>

        <View style={styles.buttonRow}>
          <BrandButton label="Primary" variant="primary" />
          <BrandButton label="Secondary" variant="secondary" />
        </View>
        <View style={styles.buttonRow}>
          <BrandButton label="Outline" variant="outline" />
          <BrandButton label="Delete" variant="destructive" />
        </View>

        <BrandInput placeholder="Input sample" />

        <View style={styles.badgeRow}>
          <BrandBadge label="Primary" />
          <BrandBadge label="Secondary" tone="secondary" />
          <BrandBadge label="Accent" tone="accent" />
        </View>

        <BrandButton label="Toggle light / dark" onPress={toggleMode} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
