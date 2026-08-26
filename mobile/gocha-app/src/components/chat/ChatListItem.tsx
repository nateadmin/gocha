import { Pressable, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../app/Avatar';
import type { ChatSummary } from '../../data/mock';
import { useGochaTheme } from '../../theme';

type Props = {
  chat: ChatSummary;
  onPress: () => void;
};

export function ChatListItem({ chat, onPress }: Props) {
  const { theme } = useGochaTheme();

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar
        label={chat.avatarLabel}
        color={chat.avatarColor}
        badge={chat.isGroup ? chat.groupCount : undefined}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 17,
                fontWeight: '600',
              }}>
              {chat.name}
            </Text>
            {chat.pinned ? (
              <Ionicons name="pin" size={14} color={theme.colors.mutedForeground} />
            ) : null}
          </View>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
            }}>
            {chat.dateLabel}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 15,
            }}>
            {chat.preview}
          </Text>
          {chat.unreadCount ? (
            <View
              style={[
                styles.unread,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: theme.colors.primaryForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 12,
                }}>
                {chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unread: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
