import { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CtaButton } from '../../components/brand';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList } from '../../navigation/types';

export function ChatLockScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatsStackParamList, 'ChatLock'>>();
  const { theme } = useGochaTheme();
  const { verifyLockPin, getChat } = useChat();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chat = getChat(route.params.chatId);

  function unlock() {
    if (verifyLockPin(pin)) {
      navigation.replace('ChatDetail', { chatId: route.params.chatId });
      return;
    }
    setError('Incorrect PIN.');
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
      </Pressable>
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 24,
          marginBottom: 8,
        }}>
        Locked chat
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 24 }}>
        Enter your chat lock PIN to open {chat?.name ?? 'this chat'}.
      </Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="PIN"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.cardForeground,
            borderRadius: theme.radii.card,
          },
        ]}
      />
      {error ? (
        <Text style={{ color: theme.colors.destructive, marginBottom: 12 }}>{error}</Text>
      ) : null}
      <CtaButton label="Unlock" onPress={unlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24 },
  back: { marginBottom: 24 },
  input: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    fontSize: 18,
  },
});
