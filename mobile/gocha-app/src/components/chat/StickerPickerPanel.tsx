import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';

import { useChat } from '../../chat/ChatContext';
import { STICKER_PACKS } from '../../chat/seedData';
import { useGochaTheme } from '../../theme';

type Props = {
  onPick: (stickerKey: string) => void;
};

export function StickerPickerPanel({ onPick }: Props) {
  const { theme } = useGochaTheme();
  const { stickerEmoji } = useChat();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled>
        {STICKER_PACKS.map((pack) => (
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
                <Pressable key={key} onPress={() => onPick(key)} style={styles.cell}>
                  <Text style={{ fontSize: 32 }}>{stickerEmoji[key] ?? '⭐'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    height: 260,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  pack: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
