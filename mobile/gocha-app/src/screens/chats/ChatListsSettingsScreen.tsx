import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CtaButton } from '../../components/brand';
import { useChat } from '../../chat/ChatContext';
import { useGochaTheme } from '../../theme';

export function ChatListsSettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useGochaTheme();
  const { lists, createList, deleteList, muteList, unmuteList } = useChat();
  const [newName, setNewName] = useState('');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
      </Pressable>
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 26,
          marginBottom: 16,
        }}>
        Chat lists
      </Text>

      {lists.map((list) => (
        <View
          key={list.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <Text style={{ color: theme.colors.cardForeground, fontSize: 16, fontWeight: '600' }}>
            {list.name}
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>
            {list.chatIds.length} chats
          </Text>
          <View style={styles.row}>
            <Pressable onPress={() => (list.muted ? unmuteList(list.id) : muteList(list.id))}>
              <Text style={{ color: theme.colors.primary }}>
                {list.muted ? 'Unmute list' : 'Mute list'}
              </Text>
            </Pressable>
            <Pressable onPress={() => deleteList(list.id)}>
              <Text style={{ color: theme.colors.destructive }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <TextInput
        value={newName}
        onChangeText={setNewName}
        placeholder="New list name"
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
        label="Create list"
        onPress={() => {
          if (newName.trim()) {
            createList(newName.trim());
            setNewName('');
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  back: { marginBottom: 8 },
  card: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  row: { flexDirection: 'row', gap: 16, marginTop: 8 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    marginTop: 8,
  },
});
