import { Pressable, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ChatMessage } from '../../chat/types';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

type Props = {
  message: ChatMessage;
  replyPreview?: string;
  onLongPress?: () => void;
};

export function MessageBubble({ message, replyPreview, onLongPress }: Props) {
  const { theme } = useGochaTheme();
  const { stickerEmoji } = useChat();
  const outgoing = message.isOutgoing;

  const bubbleContent = (() => {
    switch (message.type) {
      case 'voice':
        return (
          <View style={styles.voiceRow}>
            <Ionicons
              name="play"
              size={18}
              color={outgoing ? theme.colors.primaryForeground : theme.colors.primary}
            />
            <View style={styles.waveform}>
              {[...Array(12)].map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 3,
                    height: 6 + (index % 4) * 4,
                    backgroundColor: outgoing
                      ? theme.colors.primaryForeground
                      : theme.colors.primary,
                    borderRadius: 2,
                  }}
                />
              ))}
            </View>
            <Text
              style={{
                color: outgoing
                  ? theme.colors.primaryForeground
                  : theme.colors.cardForeground,
                fontFamily: theme.typography.mono,
                fontSize: 13,
              }}>
              {message.durationSec ?? 0}s
            </Text>
          </View>
        );
      case 'video':
        return (
          <View style={styles.mediaBox}>
            <Ionicons name="videocam" size={32} color={theme.colors.primaryForeground} />
            <Text style={{ color: theme.colors.primaryForeground, fontSize: 13 }}>Video</Text>
          </View>
        );
      case 'image':
        return (
          <View style={[styles.mediaBox, { backgroundColor: theme.colors.secondary }]}>
            <Ionicons name="image" size={32} color={theme.colors.primaryForeground} />
            <Text style={{ color: theme.colors.primaryForeground, fontSize: 13 }}>Photo</Text>
          </View>
        );
      case 'file':
        return (
          <View style={styles.fileRow}>
            <Ionicons name="document-outline" size={22} color={theme.colors.primary} />
            <Text
              style={{
                color: outgoing
                  ? theme.colors.primaryForeground
                  : theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 15,
              }}>
              {message.fileName ?? 'File'}
            </Text>
          </View>
        );
      case 'sticker':
        return (
          <Text style={{ fontSize: 48 }}>
            {stickerEmoji[message.stickerKey ?? ''] ?? '⭐'}
          </Text>
        );
      case 'emoji':
        return <Text style={{ fontSize: 40 }}>{message.text}</Text>;
      default:
        return (
          <Text
            style={{
              color: outgoing
                ? theme.colors.primaryForeground
                : theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 16,
              lineHeight: 22,
            }}>
            {message.text}
          </Text>
        );
    }
  })();

  return (
    <Pressable
      onLongPress={onLongPress}
      style={[styles.wrap, outgoing ? styles.outgoing : styles.incoming]}>
      {replyPreview ? (
        <View
          style={[
            styles.reply,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <Text
            numberOfLines={1}
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
            }}>
            {replyPreview}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          message.type === 'sticker' || message.type === 'emoji'
            ? styles.stickerBubble
            : null,
          {
            backgroundColor:
              message.type === 'sticker' || message.type === 'emoji'
                ? 'transparent'
                : outgoing
                  ? theme.colors.primary
                  : theme.colors.muted,
            borderRadius: theme.radii.card,
          },
        ]}>
        {bubbleContent}
      </View>
      <View style={styles.meta}>
        {message.starred ? (
          <Ionicons name="star" size={12} color={theme.colors.accent} />
        ) : null}
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 11,
          }}>
          {message.sentAt}
        </Text>
        {outgoing && message.status ? (
          <Ionicons
            name={message.status === 'read' ? 'checkmark-done' : 'checkmark'}
            size={14}
            color={theme.colors.secondary}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    maxWidth: '82%',
  },
  incoming: {
    alignSelf: 'flex-start',
  },
  outgoing: {
    alignSelf: 'flex-end',
  },
  reply: {
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stickerBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 140,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  mediaBox: {
    width: 160,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B00D8',
    borderRadius: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
