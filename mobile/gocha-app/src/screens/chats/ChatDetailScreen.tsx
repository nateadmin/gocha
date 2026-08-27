import { useLayoutEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../../components/app';
import { CtaButton } from '../../components/brand';
import { ActionSheet, ChatComposer, MessageBubble } from '../../components/chat';
import type { ActionSheetItem } from '../../components/chat/ActionSheet';
import { useChat } from '../../chat/ChatContext';
import { ORDER_ASSISTANT_SUGGESTIONS } from '../../chat/orderAssistant';
import type { ChatMessage } from '../../chat/types';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList, RootTabParamList } from '../../navigation/types';

export function ChatDetailScreen() {
  const navigation = useNavigation();
  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<ChatsStackParamList, 'ChatDetail'>>();
  const { theme } = useGochaTheme();
  const insets = useSafeAreaInsets();
  const chatApi = useChat();
  const chat = chatApi.getChat(route.params.chatId);
  const messages = chatApi.messagesFor(route.params.chatId);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [messageMenu, setMessageMenu] = useState<ChatMessage | null>(null);

  useLayoutEffect(() => {
    if (!tabNavigation) {
      return;
    }

    tabNavigation.setOptions({
      tabBarStyle: {
        display: 'none',
        height: 0,
        minHeight: 0,
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      },
    });

    return () => {
      tabNavigation.setOptions({ tabBarStyle: undefined });
    };
  }, [tabNavigation]);

  if (!chat) {
    return null;
  }

  const visibleMessages = searchOpen && searchQuery.trim()
    ? messages.filter((message) =>
        (message.text ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : messages;

  function handleSend(text?: string) {
    const message = (text ?? draft).trim();
    if (!message) return;
    chatApi.sendTextMessage(route.params.chatId, message, replyTo?.id);
    setDraft('');
    setReplyTo(null);
  }

  const chatMenuItems: ActionSheetItem[] = [
    {
      id: 'search',
      label: 'Search in chat',
      onPress: () => setSearchOpen(true),
    },
    {
      id: 'clear',
      label: 'Clear chat',
      onPress: () => chatApi.clearChat(route.params.chatId),
    },
    ...(chat.isOrderAssistant
      ? []
      : [
          chat.pinned
            ? { id: 'unpin', label: 'Unpin', onPress: () => chatApi.unpinChat(chat.id) }
            : { id: 'pin', label: 'Pin', onPress: () => chatApi.pinChat(chat.id) },
        ]),
    chat.muted
      ? { id: 'unmute', label: 'Unmute', onPress: () => chatApi.unmuteChat(chat.id) }
      : { id: 'mute', label: 'Mute 8 hours', onPress: () => chatApi.muteChat(chat.id, '8h') },
    chat.isSecret
      ? { id: 'regular', label: 'Switch to regular chat', onPress: () => chatApi.toggleSecretChat(chat.id) }
      : { id: 'secret', label: 'Start secret chat', onPress: () => chatApi.toggleSecretChat(chat.id) },
    {
      id: 'disappear',
      label: chat.disappearingTimerSec
        ? 'Turn off disappearing messages'
        : 'Disappearing messages (1 min)',
      onPress: () =>
        chatApi.setDisappearingTimer(
          chat.id,
          chat.disappearingTimerSec ? null : 60,
        ),
    },
    {
      id: 'block',
      label: chat.blocked ? 'Unblock' : 'Block',
      onPress: () =>
        chat.blocked ? chatApi.unblockChat(chat.id) : chatApi.blockChat(chat.id),
    },
    ...(chat.isOrderAssistant
      ? []
      : [
          {
            id: 'delete',
            label: 'Delete chat',
            destructive: true,
            onPress: () => {
              chatApi.deleteChat(chat.id);
              navigation.goBack();
            },
          },
        ]),
  ];

  const messageMenuItems: ActionSheetItem[] = messageMenu
    ? [
        {
          id: 'reply',
          label: 'Reply',
          onPress: () => setReplyTo(messageMenu),
        },
        {
          id: 'copy',
          label: 'Copy',
          onPress: () => {},
        },
        messageMenu.starred
          ? {
              id: 'unstar',
              label: 'Unstar',
              onPress: () =>
                chatApi.unstarMessage(route.params.chatId, messageMenu.id),
            }
          : {
              id: 'star',
              label: 'Star',
              onPress: () =>
                chatApi.starMessage(route.params.chatId, messageMenu.id),
            },
        {
          id: 'delete-me',
          label: 'Delete for me',
          onPress: () =>
            chatApi.deleteMessage(route.params.chatId, messageMenu.id),
        },
        {
          id: 'delete-all',
          label: 'Delete for everyone',
          destructive: true,
          onPress: () =>
            chatApi.deleteMessage(route.params.chatId, messageMenu.id, true),
        },
      ]
    : [];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
            paddingTop: insets.top + 6,
          },
        ]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Avatar label={chat.avatarLabel} color={chat.avatarColor} size={40} />
        <Pressable
          style={styles.headerText}
          onPress={() => navigation.navigate('ChatInfo', { chatId: chat.id })}>
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
            {chat.isSecret ? 'Secret chat' : chat.isOrderAssistant ? 'Book, chat, and order' : 'Tap for contact info'}
          </Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setSearchOpen((value) => !value)} hitSlop={8}>
            <Ionicons name="search" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Ionicons
              name="ellipsis-vertical"
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {searchOpen ? (
        <View style={[styles.searchBar, { backgroundColor: theme.colors.muted }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages"
            placeholderTextColor={theme.colors.mutedForeground}
            style={{
              flex: 1,
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
            }}
          />
          <Pressable onPress={() => setSearchOpen(false)}>
            <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        style={{ flex: 1, backgroundColor: theme.colors.card }}
        renderItem={({ item }) => {
          const replySource = item.replyToId
            ? messages.find((message) => message.id === item.replyToId)
            : null;
          return (
            <MessageBubble
              message={item}
              replyPreview={replySource?.text ?? replySource?.stickerKey}
              onLongPress={() => setMessageMenu(item)}
            />
          );
        }}
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
                {new Date().toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        }
      />

      {chat.isOrderAssistant ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionScroll}
          contentContainerStyle={styles.suggestionRow}>
          {ORDER_ASSISTANT_SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => handleSend(suggestion)}
              style={[
                styles.suggestionChip,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.muted,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 13,
                }}>
                {suggestion}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ChatComposer
        value={draft}
        onChangeText={setDraft}
        onSend={handleSend}
        onSendEmoji={(emoji) => chatApi.sendEmojiMessage(route.params.chatId, emoji)}
        onSendSticker={(key) => chatApi.sendStickerMessage(route.params.chatId, key)}
        onSendVoice={(duration) =>
          chatApi.sendVoiceMessage(route.params.chatId, duration)
        }
        onAttachImage={(media) =>
          chatApi.sendMediaMessage(route.params.chatId, 'image', {
            fileName: media.fileName,
            mediaUrl: media.uri,
            mimeType: media.mimeType,
          })
        }
        onAttachVideo={(media) =>
          chatApi.sendMediaMessage(route.params.chatId, 'video', {
            fileName: media.fileName,
            mediaUrl: media.uri,
            mimeType: media.mimeType,
          })
        }
        onAttachFile={(media) =>
          chatApi.sendMediaMessage(route.params.chatId, 'file', {
            fileName: media.fileName,
            mediaUrl: media.uri,
            mimeType: media.mimeType,
          })
        }
        replyLabel={replyTo?.text ?? replyTo?.stickerKey}
        onCancelReply={() => setReplyTo(null)}
      />

      <ActionSheet
        visible={menuOpen}
        title="Chat options"
        items={chatMenuItems}
        onClose={() => setMenuOpen(false)}
      />
      <ActionSheet
        visible={messageMenu !== null}
        title="Message"
        items={messageMenuItems}
        onClose={() => setMessageMenu(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  messages: { paddingHorizontal: 16, paddingBottom: 16 },
  datePillWrap: { alignItems: 'center', marginVertical: 12 },
  datePill: { paddingHorizontal: 12, paddingVertical: 6 },
  suggestionScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
});
