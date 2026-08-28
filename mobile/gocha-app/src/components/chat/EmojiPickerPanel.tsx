import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';

import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

type Props = {
  onPick: (emoji: string) => void;
};

export function EmojiPickerPanel({ onPick }: Props) {
  const { theme } = useGochaTheme();
  const { emojiGrid } = useChat();

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
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator
        nestedScrollEnabled>
        {emojiGrid.map((emoji) => (
          <Pressable key={emoji} onPress={() => onPick(emoji)} style={styles.cell}>
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    height: 220,
  },
  scroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
