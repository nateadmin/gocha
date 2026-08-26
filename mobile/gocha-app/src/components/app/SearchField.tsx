import { View, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder }: Props) {
  const { theme } = useGochaTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.muted,
          borderRadius: theme.radii.pill,
        },
      ]}>
      <Ionicons name="search" size={18} color={theme.colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        style={[
          styles.input,
          {
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
});
