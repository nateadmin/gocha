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
  const { verifyLockPin, getChat, preferences, setChatLockPin } = useChat();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chat = getChat(route.params.chatId);
  const needsSetup = !preferences.chatLockPin;

  function unlock() {
    if (verifyLockPin(pin)) {
      navigation.replace('ChatDetail', { chatId: route.params.chatId });
      return;
    }
    setError('Incorrect PIN.');
  }

  function savePin() {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    setChatLockPin(pin);
    setError(null);
    navigation.replace('ChatDetail', { chatId: route.params.chatId });
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
        {needsSetup || setupMode
          ? 'Create a chat lock PIN to open protected conversations.'
          : `Enter your chat lock PIN to open ${chat?.name ?? 'this chat'}.`}
      </Text>

      {needsSetup || setupMode ? (
        <>
          <TextInputField
            value={pin}
            onChangeText={setPin}
            placeholder="New PIN"
            theme={theme}
          />
          <TextInputField
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm PIN"
            theme={theme}
          />
          <CtaButton label="Save PIN and open" onPress={savePin} />
        </>
      ) : (
        <>
          <TextInputField value={pin} onChangeText={setPin} placeholder="PIN" theme={theme} />
          <CtaButton label="Unlock" onPress={unlock} />
          <Pressable onPress={() => setSetupMode(true)} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.primary, textAlign: 'center' }}>Reset PIN</Text>
          </Pressable>
        </>
      )}

      {error ? (
        <Text style={{ color: theme.colors.destructive, marginTop: 12 }}>{error}</Text>
      ) : null}
    </View>
  );
}

function TextInputField({
  value,
  onChangeText,
  placeholder,
  theme,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  theme: ReturnType<typeof useGochaTheme>['theme'];
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="number-pad"
      secureTextEntry
      maxLength={6}
      placeholder={placeholder}
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
