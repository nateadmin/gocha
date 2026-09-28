import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatApiError } from '../../api/formatApiError';
import type { PublicUserProfile } from '../../api/client';
import { CtaButton } from '../../components/brand';
import { MemberPicker } from '../../components/chat/MemberPicker';
import { useChat } from '../../chat/ChatContext';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function NewBroadcastScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const { createBroadcast, refreshConversations } = useChat();
  const { theme } = useGochaTheme();
  const [name, setName] = useState('');
  const [members, setMembers] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshConversations();
    }, [refreshConversations]),
  );

  function addMember(profile: PublicUserProfile) {
    setMembers((prev) => (prev.some((member) => member.id === profile.id) ? prev : [...prev, profile]));
  }

  function removeMember(userId: number) {
    setMembers((prev) => prev.filter((member) => member.id !== userId));
  }

  async function create() {
    if (!name.trim()) {
      setError('Broadcast name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = await createBroadcast(
        name.trim(),
        members.map((member) => member.id),
      );
      navigation.replace('ChatDetail', { chatId: id });
    } catch (err) {
      setError(formatApiError(err, 'Could not create broadcast.'));
    } finally {
      setLoading(false);
    }
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
        Send one message to many recipients. Add or remove people now, or later from the broadcast.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Broadcast name"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <MemberPicker
        members={members}
        onAdd={addMember}
        onRemove={removeMember}
        helperText="Type a name to add or tap a name to remove it."
      />

      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 8 }}>{error}</Text> : null}
      <CtaButton label="Create broadcast" loading={loading} onPress={() => void create()} />
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
