import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CtaButton } from '../../components/brand';
import { useChat } from '../../chat/ChatContext';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function NewBroadcastScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const chat = useChat();
  const { theme } = useGochaTheme();
  const [name, setName] = useState('');

  function create() {
    const id = chat.createBroadcast(name);
    navigation.replace('ChatDetail', { chatId: id });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Chats</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        New broadcast
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16 }}>
        Send one message to many recipients. Add subscribers from the broadcast chat.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Broadcast name"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <CtaButton label="Create broadcast" onPress={create} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
});
