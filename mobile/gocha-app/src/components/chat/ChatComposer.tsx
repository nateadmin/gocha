import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend?: () => void;
};

export function ChatComposer({ value, onChangeText, onSend }: Props) {
  const { theme } = useGochaTheme();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);

  const webInputReset =
    Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
        } as const)
      : {};

  return (
    <View
      style={[
        styles.bar,
        {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          paddingBottom: Math.max(insets.bottom, 10),
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Message"
        placeholderTextColor={theme.colors.mutedForeground}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          webInputReset,
          {
            backgroundColor: theme.colors.muted,
            color: theme.colors.cardForeground,
            borderRadius: theme.radii.pill,
            fontFamily: theme.typography.sans,
            borderWidth: focused ? 1 : 0,
            borderColor: theme.colors.primary,
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
    paddingTop: 10,
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
