import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ChatListItem } from '../../components/chat';
import { CtaButton } from '../../components/brand';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

export function HiddenChatsScreen() {
  const navigation = useNavigation();
  const { theme } = useGochaTheme();
  const { hiddenChats, verifyHiddenPin } = useChat();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');

  if (!unlocked) {
    return (
      <View style={[styles.gate, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.serif,
            fontSize: 24,
            marginTop: 24,
            marginBottom: 8,
          }}>
          Hidden chats
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16 }}>
          Enter PIN to view hidden conversations.
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
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
        <CtaButton
          label="Unlock"
          onPress={() => {
            if (verifyHiddenPin(pin)) setUnlocked(true);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.serif,
            fontSize: 22,
          }}>
          Hidden chats
        </Text>
      </View>
      <FlatList
        data={hiddenChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            onPress={() =>
              navigation.navigate('ChatDetail', { chatId: item.id } as never)
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, padding: 24 },
  input: { borderWidth: 1, padding: 14, marginBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
});
