import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../config/api';
import { placeholderTheme as theme } from '../theme/placeholders';

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>gocha</Text>
        <Text style={styles.body}>
          Mobile-first shell. Branding, navigation, and chat surfaces ship after
          the template styling arrives.
        </Text>
        <View style={styles.card}>
          <Text style={styles.label}>Planned API host</Text>
          <Text style={styles.value}>{API_BASE_URL}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.screen,
    gap: theme.spacing.section,
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.text,
  },
  body: {
    fontSize: theme.typography.body,
    lineHeight: 24,
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: theme.spacing.section,
    gap: theme.spacing.stack,
  },
  label: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
});
