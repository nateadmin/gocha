import { Pressable, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../app/Avatar';
import type { ChatRecord } from '../../chat/types';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

type Props = {
  chat: ChatRecord;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

export function ChatListItem({ chat, selected, onPress, onLongPress }: Props) {
  const { theme } = useGochaTheme();
  const { labels, preferences } = useChat();

  const chatLabels = preferences.labelsEnabled
    ? labels.filter((label) => chat.labelIds.includes(label.id))
    : [];

  const rowBackground =
    selected ? theme.colors.muted : theme.colors.card;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.row, { backgroundColor: rowBackground }]}>
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
            {chat.muted ? (
              <Ionicons name="volume-mute" size={14} color={theme.colors.mutedForeground} />
            ) : null}
            {chat.locked ? (
              <Ionicons name="lock-closed" size={14} color={theme.colors.primary} />
            ) : null}
            {chat.isSecret ? (
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.accent} />
            ) : null}
            {chat.isBusiness ? (
              <Ionicons name="storefront-outline" size={14} color={theme.colors.primary} />
            ) : null}
            {chat.favorite ? (
              <Ionicons name="heart" size={14} color={theme.colors.accent} />
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
          {(chat.unreadCount > 0 || chat.markedUnread) ? (
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
                {chat.unreadCount > 0 ? chat.unreadCount : ''}
              </Text>
            </View>
          ) : null}
        </View>
        {chatLabels.length > 0 ? (
          <View style={styles.labelRow}>
            {chatLabels.map((label) => (
              <View
                key={label.id}
                style={[
                  styles.labelChip,
                  {
                    backgroundColor: label.color,
                    borderRadius: theme.radii.pill,
                  },
                ]}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '600' }}>{label.name}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
    flex: 1,
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
  labelRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  labelChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});
