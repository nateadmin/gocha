import { useState } from 'react';
import { Image, Pressable, View, Text, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ChatMessage } from '../../chat/types';
import { receiptTicks } from '../../chat/receiptTicks';
import { useChat } from '../../chat/ChatContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { OfferCard, PollCard, RsvpCard } from './GroupPostCards';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { useGochaTheme } from '../../theme';

type Props = {
  message: ChatMessage;
  replyPreview?: string;
  onLongPress?: () => void;
  showSender?: boolean;
  onAct?: (action: 'claim' | 'unclaim' | 'taken' | 'release' | 'vote' | 'close', choice?: string) => void;
};

export function MessageBubble({ message, replyPreview, onLongPress, showSender, onAct }: Props) {
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const { stickerEmoji } = useChat();
  const [showOriginal, setShowOriginal] = useState(false);
  const outgoing = message.isOutgoing;
  const ticks = outgoing ? receiptTicks(message.status) : null;
  const canToggleOriginal =
    !outgoing &&
    Boolean(message.isTranslated) &&
    Boolean(message.originalText) &&
    message.originalText !== message.text;
  const displayText = canToggleOriginal && showOriginal ? message.originalText : message.text;

  const bubbleContent = (() => {
    switch (message.type) {
      case 'voice':
        return (
          <VoiceMessagePlayer
            mediaUrl={message.mediaUrl}
            durationSec={message.durationSec}
            outgoing={outgoing}
          />
        );
      case 'video':
        if (message.mediaUrl) {
          if (Platform.OS === 'web') {
            return (
              <video
                src={message.mediaUrl}
                controls
                style={{
                  width: 220,
                  maxWidth: '100%',
                  borderRadius: 12,
                  display: 'block',
                }}
              />
            );
          }
          return (
            <View style={styles.mediaBox}>
              <Ionicons name="videocam" size={32} color={theme.colors.primaryForeground} />
              <Text
                numberOfLines={1}
                style={{ color: theme.colors.primaryForeground, fontSize: 13 }}>
                {message.fileName ?? 'Video'}
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.mediaBox}>
            <Ionicons name="videocam" size={32} color={theme.colors.primaryForeground} />
            <Text style={{ color: theme.colors.primaryForeground, fontSize: 13 }}>Video</Text>
          </View>
        );
      case 'image':
        if (message.mediaUrl) {
          return (
            <Image
              accessibilityLabel={message.fileName ?? 'Photo'}
              source={{ uri: message.mediaUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          );
        }
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
      case 'offer':
        return <OfferCard message={message} onAct={onAct} />;
      case 'poll':
        return <PollCard message={message} onAct={onAct} />;
      case 'rsvp':
        return <RsvpCard message={message} onAct={onAct} />;
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
            {displayText}
          </Text>
        );
    }
  })();

  const isMediaPreview =
    (message.type === 'image' || message.type === 'video') && Boolean(message.mediaUrl);
  const isPost = message.type === 'offer' || message.type === 'poll' || message.type === 'rsvp';

  return (
    <View style={[styles.row, outgoing ? styles.rowOutgoing : styles.rowIncoming]}>
    <Pressable
      onLongPress={onLongPress}
      style={styles.wrap}>
      {showSender && !outgoing && message.senderName ? (
        <Text
          style={{
            color: theme.colors.primary,
            fontFamily: theme.typography.sans,
            fontSize: 12,
            marginBottom: 4,
            paddingHorizontal: 4,
          }}>
          {message.senderName}
        </Text>
      ) : null}
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
          isMediaPreview || isPost ? styles.mediaBubble : null,
          {
            backgroundColor:
              message.type === 'sticker' || message.type === 'emoji' || isMediaPreview || isPost
                ? 'transparent'
                : outgoing
                  ? theme.colors.primary
                  : theme.colors.muted,
            borderRadius: theme.radii.card,
          },
        ]}>
        {bubbleContent}
      </View>
      {canToggleOriginal ? (
        <Pressable
          onPress={() => setShowOriginal((value) => !value)}
          accessibilityRole="button"
          style={styles.originalToggle}>
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.typography.sans,
              fontSize: 12,
            }}>
            {showOriginal ? t('chat.showTranslation') : t('chat.showOriginal')}
          </Text>
        </Pressable>
      ) : null}
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
        {ticks ? (
          <Ionicons
            name={ticks.icon}
            size={14}
            color={
              ticks.tone === 'highlight'
                ? theme.colors.primary
                : theme.colors.mutedForeground
            }
          />
        ) : null}
      </View>
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 12,
  },
  rowIncoming: {
    justifyContent: 'flex-start',
  },
  rowOutgoing: {
    justifyContent: 'flex-end',
  },
  wrap: {
    maxWidth: '82%',
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
  mediaBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  originalToggle: {
    marginTop: 4,
    paddingHorizontal: 4,
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
  mediaImage: {
    width: 220,
    maxWidth: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#1B00D8',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
