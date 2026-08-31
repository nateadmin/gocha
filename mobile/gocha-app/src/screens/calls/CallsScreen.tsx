import { Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

export function CallsScreen() {
  const { theme } = useGochaTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.serif,
            fontSize: 28,
          }}>
          Calls
        </Text>
      </View>
      <View style={styles.body}>
        <Ionicons name="call-outline" size={40} color={theme.colors.mutedForeground} />
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 18,
            fontWeight: '600',
          }}>
          Coming soon
        </Text>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
          }}>
          Voice and video need a call provider.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
});
