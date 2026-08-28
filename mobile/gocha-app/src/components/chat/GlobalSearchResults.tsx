import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../app/Avatar';
import { SwipeableChatListItem } from './SwipeableChatListItem';
import type { ChatRecord } from '../../chat/types';
import type {
  GlobalSearchContactResult,
  GlobalSearchMessageResult,
  PublicUserProfile,
} from '../../api/client';
import { useGochaTheme } from '../../theme';

type Props = {
  query: string;
  conversations: ChatRecord[];
  contacts: GlobalSearchContactResult[];
  localContacts: ChatRecord[];
  messages: GlobalSearchMessageResult[];
  people: PublicUserProfile[];
  loading: boolean;
  startingChatUserId: number | null;
  onOpenChat: (chatId: string) => void;
  onOpenContact: (conversationId: number) => void;
  onOpenMessage: (conversationId: number) => void;
  onStartChatWithPerson: (profile: PublicUserProfile) => void;
  onLongPressChat: (chat: ChatRecord) => void;
};

function SearchSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { theme } = useGochaTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
              marginTop: 2,
            }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.sectionBody,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        {children}
      </View>
    </View>
  );
}

function ContactRow({
  displayName,
  username,
  onPress,
  trailing,
}: {
  displayName: string;
  username?: string | null;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  const { theme } = useGochaTheme();

  return (
    <Pressable onPress={onPress} style={styles.contactRow}>
      <Avatar label={displayName.slice(0, 2).toUpperCase()} color={theme.colors.primary} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 16,
            fontWeight: '600',
          }}>
          {displayName}
        </Text>
        {username ? (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 13,
            }}>
            @{username}
          </Text>
        ) : (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 13,
            }}>
            In your chats
          </Text>
        )}
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
      )}
    </Pressable>
  );
}

function MessageResultRow({
  message,
  onPress,
}: {
  message: GlobalSearchMessageResult;
  onPress: () => void;
}) {
  const { theme } = useGochaTheme();
  const sentLabel = message.sentAt
    ? new Date(message.sentAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <Pressable onPress={onPress} style={styles.messageRow}>
      <View style={[styles.messageIcon, { backgroundColor: theme.colors.muted }]}>
        <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.messageMeta}>
          <Text
            numberOfLines={1}
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 15,
              fontWeight: '600',
              flex: 1,
            }}>
            {message.conversationName}
          </Text>
          {sentLabel ? (
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 12,
              }}>
              {sentLabel}
            </Text>
          ) : null}
        </View>
        <Text
          numberOfLines={2}
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 14,
          }}>
          {message.isOutgoing ? 'You: ' : ''}
          {message.text}
        </Text>
      </View>
    </Pressable>
  );
}

export function GlobalSearchResults({
  query,
  conversations,
  contacts,
  localContacts,
  messages,
  people,
  loading,
  startingChatUserId,
  onOpenChat,
  onOpenContact,
  onOpenMessage,
  onStartChatWithPerson,
  onLongPressChat,
}: Props) {
  const { theme } = useGochaTheme();
  const trimmed = query.trim();
  const hasLocalResults = conversations.length > 0 || localContacts.length > 0;
  const hasRemoteResults = contacts.length > 0 || messages.length > 0 || people.length > 0;
  const showRemoteLoading = loading && trimmed.length >= 2;

  if (!trimmed) {
    return null;
  }

  if (!hasLocalResults && !hasRemoteResults && !showRemoteLoading) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.card }]}>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 15,
            textAlign: 'center',
          }}>
          {trimmed.length < 2
            ? 'Keep typing to search messages and discoverable people.'
            : 'No matches yet. For new people, type the full name exactly or use @username.'}
        </Text>
      </View>
    );
  }

  const remoteContactIds = new Set(contacts.map((contact) => String(contact.conversationId)));
  const visibleLocalContacts = localContacts.filter(
    (chat) => !remoteContactIds.has(chat.id),
  );
  const visibleRemoteContacts = contacts.filter(
    (contact) => !conversations.some((chat) => chat.id === String(contact.conversationId)),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      {conversations.length > 0 ? (
        <SearchSection title="Conversations">
          {conversations.map((chat) => (
            <SwipeableChatListItem
              key={chat.id}
              chat={chat}
              selected={false}
              onPress={() => onOpenChat(chat.id)}
              onLongPress={() => onLongPressChat(chat)}
            />
          ))}
        </SearchSection>
      ) : null}

      {visibleLocalContacts.length > 0 || visibleRemoteContacts.length > 0 ? (
        <SearchSection title="Contacts" subtitle="People you have chatted with">
          {visibleLocalContacts.map((chat) => (
            <ContactRow
              key={chat.id}
              displayName={chat.name}
              onPress={() => onOpenChat(chat.id)}
            />
          ))}
          {visibleRemoteContacts.map((contact) => (
            <ContactRow
              key={`remote-${contact.conversationId}`}
              displayName={contact.displayName}
              username={contact.username}
              onPress={() => onOpenContact(contact.conversationId)}
            />
          ))}
        </SearchSection>
      ) : null}

      {messages.length > 0 ? (
        <SearchSection title="Messages" subtitle="Matches inside your conversations">
          {messages.map((message) => (
            <MessageResultRow
              key={message.id}
              message={message}
              onPress={() => onOpenMessage(message.conversationId)}
            />
          ))}
        </SearchSection>
      ) : null}

      {showRemoteLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}

      {people.length > 0 ? (
        <SearchSection
          title="People on Gocha"
          subtitle="Type the full name exactly, or search with @username">
          {people.map((person) => (
            <ContactRow
              key={person.id}
              displayName={person.displayName}
              username={person.username}
              onPress={() => onStartChatWithPerson(person)}
              trailing={
                startingChatUserId === person.id ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Ionicons name="person-add-outline" size={18} color={theme.colors.primary} />
                )
              }
            />
          ))}
        </SearchSection>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  section: {
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 4,
  },
  sectionBody: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  messageMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingWrap: {
    paddingVertical: 16,
  },
  empty: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
});
