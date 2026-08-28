import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';

import { useChat } from '../../chat/ChatContext';
import { STICKER_PACKS } from '../../chat/seedData';
import { useGochaTheme } from '../../theme';

type Tab = 'emoji' | 'stickers';

type Props = {
  onPickEmoji: (emoji: string) => void;
  onPickSticker: (stickerKey: string) => void;
};

export function EmojiStickerPickerPanel({ onPickEmoji, onPickSticker }: Props) {
  const { theme } = useGochaTheme();
  const { emojiGrid, stickerEmoji } = useChat();
  const [tab, setTab] = useState<Tab>('emoji');

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}>
      <View style={styles.tabs}>
        {(['emoji', 'stickers'] as Tab[]).map((item) => {
          const active = tab === item;
          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.muted,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: active
                    ? theme.colors.primaryForeground
                    : theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                {item === 'emoji' ? 'Emoji' : 'Stickers'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled>
        {tab === 'emoji' ? (
          <View style={styles.grid}>
            {emojiGrid.map((emoji) => (
              <Pressable key={emoji} onPress={() => onPickEmoji(emoji)} style={styles.emojiCell}>
                <Text style={{ fontSize: 26 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          STICKER_PACKS.map((pack) => (
            <View key={pack.id} style={styles.pack}>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 12,
                  marginBottom: 8,
                }}>
                {pack.name}
              </Text>
              <View style={styles.grid}>
                {pack.stickers.map((key) => (
                  <Pressable key={key} onPress={() => onPickSticker(key)} style={styles.stickerCell}>
                    <Text style={{ fontSize: 32 }}>{stickerEmoji[key] ?? '⭐'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 260,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  emojiCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerCell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pack: {
    marginBottom: 12,
  },
});
