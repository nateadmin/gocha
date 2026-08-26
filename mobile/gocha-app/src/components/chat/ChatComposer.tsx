import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend?: () => void;
};

export function ChatComposer({ value, onChangeText, onSend }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
      ]}>
      <Pressable hitSlop={8}>
        <Ionicons name="add" size={26} color={theme.colors.primary} />
      </Pressable>
      <Pressable hitSlop={8}>
        <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
      </Pressable>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Message"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.muted,
            color: theme.colors.cardForeground,
            borderRadius: theme.radii.pill,
            fontFamily: theme.typography.sans,
          },
        ]}
      />
      <Pressable hitSlop={8} onPress={onSend}>
        <Ionicons name="mic-outline" size={24} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
});
