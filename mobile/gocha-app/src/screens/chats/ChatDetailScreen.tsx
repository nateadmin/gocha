import { useState } from 'react';
import { FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../../components/app';
import { ChatComposer, MessageBubble } from '../../components/chat';
import { chatMessages, getChatById } from '../../data/mock';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList } from '../../navigation/types';

export function ChatDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatsStackParamList, 'ChatDetail'>>();
  const { theme } = useGochaTheme();
  const chat = getChatById(route.params.chatId);
  const messages = chatMessages[route.params.chatId] ?? [];
  const [draft, setDraft] = useState('');

  if (!chat) {
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Avatar label={chat.avatarLabel} color={chat.avatarColor} size={40} />
        <View style={styles.headerText}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 17,
              fontWeight: '600',
            }}>
            {chat.name}
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
            }}>
            Tap for contact info
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons name="sparkles" size={22} color={theme.colors.primary} />
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={theme.colors.primary}
          />
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        style={{ flex: 1, backgroundColor: theme.colors.card }}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListHeaderComponent={
          <View style={styles.datePillWrap}>
            <View
              style={[
                styles.datePill,
                {
                  backgroundColor: theme.colors.muted,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 12,
                }}>
                August 9, 2026
              </Text>
            </View>
          </View>
        }
      />

      <ChatComposer value={draft} onChangeText={setDraft} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  messages: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  datePillWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
