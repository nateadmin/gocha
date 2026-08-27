import { FlatList, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../../components/app';
import { calls } from '../../data/mock';
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
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        style={{ backgroundColor: theme.colors.card, flex: 1 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar label={item.avatarLabel} size={48} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                {item.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 13,
                }}>
                {item.timeLabel}
              </Text>
            </View>
            <Ionicons
              name={
                item.type === 'missed'
                  ? 'call-outline'
                  : item.type === 'incoming'
                    ? 'arrow-down'
                    : 'arrow-up'
              }
              size={18}
              color={
                item.type === 'missed'
                  ? theme.colors.destructive
                  : theme.colors.primary
              }
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
