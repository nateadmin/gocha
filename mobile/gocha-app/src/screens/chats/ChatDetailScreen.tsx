import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

import { Avatar, HeaderOverflowMenu, type DropdownMenuItem } from '../../components/app';
import { ActionSheet, ChatComposer, DurationPickerSheet, MessageBubble } from '../../components/chat';
import { StatusRing } from '../../components/status/StatusRing';
import { openStatusViewer } from '../../navigation/rootNavigation';
import { statusRingTone } from '../../status/statusLogic';
import type { ActionSheetItem } from '../../components/chat/ActionSheet';
import { useChat } from '../../chat/ChatContext';
import { ORDER_ASSISTANT_SUGGESTIONS } from '../../chat/orderAssistant';
import type { ChatMessage } from '../../chat/types';
import { copyText } from '../../utils/copyText';
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
  const chatId = route.params.chatId;
  const chat = chatApi.getChat(chatId);
  const messages = chatApi.messagesFor(chatId);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState(() => chatApi.getChatDraft(chatId));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [messageMenu, setMessageMenu] = useState<ChatMessage | null>(null);
  const [mutePickerOpen, setMutePickerOpen] = useState(false);
  const [disappearPickerOpen, setDisappearPickerOpen] = useState(false);

  useEffect(() => {
    setDraft(chatApi.getChatDraft(chatId));
    return () => {
      chatApi.setChatDraft(chatId, draftRef.current);
    };
    // Draft load/save is tied to the active conversation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    void chatApi.ensureMessagesLoaded(chatId);
    chatApi.openChat(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    const interval = setInterval(() => {
      void chatApi.refreshMessagesForChat(chatId);
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

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
    chatApi.sendTextMessage(chatId, message, replyTo?.id);
    chatApi.clearChatDraft(chatId);
    setDraft('');
    setReplyTo(null);
  }

  const headerMenuTop = insets.top + 56;

  const chatMenuItems: DropdownMenuItem[] = [
    {
      id: 'search',
      label: 'Search in chat',
      icon: 'search-outline',
      onPress: () => setSearchOpen(true),
    },
    {
      id: 'clear',
      label: 'Clear chat',
      icon: 'trash-outline',
      onPress: () => chatApi.clearChat(route.params.chatId),
    },
    ...(chat.isOrderAssistant
      ? []
      : [
          chat.pinned
            ? {
                id: 'unpin',
                label: 'Unpin',
                icon: 'pin-outline',
                onPress: () => chatApi.unpinChat(chat.id),
              }
            : {
                id: 'pin',
                label: 'Pin',
                icon: 'pin-outline',
                onPress: () => chatApi.pinChat(chat.id),
              },
        ]),
    chat.muted
      ? {
          id: 'unmute',
          label: 'Unmute',
          icon: 'volume-high-outline',
          onPress: () => chatApi.unmuteChat(chat.id),
        }
      : {
          id: 'mute',
          label: 'Mute notifications',
          icon: 'volume-mute-outline',
          onPress: () => setMutePickerOpen(true),
        },
    chat.isSecret
      ? {
          id: 'regular',
          label: 'Switch to regular chat',
          icon: 'lock-open-outline',
          onPress: () => chatApi.toggleSecretChat(chat.id),
        }
      : {
          id: 'secret',
          label: 'Start secret chat',
          icon: 'lock-closed-outline',
          onPress: () => chatApi.toggleSecretChat(chat.id),
        },
    chat.hidden
      ? {
          id: 'unhide',
          label: 'Unhide chat',
          icon: 'eye-outline',
          onPress: () => chatApi.unhideChat(chat.id),
        }
      : {
          id: 'hide',
          label: 'Hide chat',
          icon: 'eye-off-outline',
          onPress: () => chatApi.hideChat(chat.id),
        },
    {
      id: 'disappear',
      label: chat.disappearingTimerSec
        ? `Disappearing: ${formatDurationLabel(chat.disappearingTimerSec)}`
        : 'Disappearing messages',
      icon: 'timer-outline',
      onPress: () => setDisappearPickerOpen(true),
    },
    {
      id: 'block',
      label: chat.blocked ? 'Unblock' : 'Block',
      icon: 'ban-outline',
      onPress: () =>
        chat.blocked ? chatApi.unblockChat(chat.id) : chatApi.blockChat(chat.id),
    },
    ...(chat.isOrderAssistant
      ? []
      : [
          {
            id: 'delete',
            label: 'Delete chat',
            icon: 'trash-outline',
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
          onPress: () => {
            const text =
              messageMenu.text ??
              (messageMenu.stickerKey ? chatApi.stickerEmoji[messageMenu.stickerKey] : '');
            void copyText(text ?? '');
          },
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
          menuOpen
            ? { position: 'relative', zIndex: theme.overlayMenu.headerZIndex + 2 }
            : null,
        ]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => {
            if (chat.hasStatus && chat.otherUserId) {
              openStatusViewer(chat.otherUserId);
              return;
            }
            navigation.navigate('ChatInfo', { chatId: chat.id });
          }}
          accessibilityRole="button">
          <StatusRing tone={statusRingTone(Boolean(chat.hasStatus), Boolean(chat.statusUnseen))} size={40}>
            <Avatar label={chat.avatarLabel} color={chat.avatarColor} size={40} />
          </StatusRing>
        </Pressable>
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
          <HeaderOverflowMenu
            open={menuOpen}
            menuTop={headerMenuTop}
            items={chatMenuItems}
            onPress={() => setMenuOpen((value) => !value)}
            onClose={() => setMenuOpen(false)}
            accessibilityLabel="Chat options"
            strokeColor={theme.colors.primary}
          />
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
        ref={listRef}
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        style={{ flex: 1, backgroundColor: theme.colors.card, direction: 'ltr' } as object}
        onContentSizeChange={() => {
          if (!searchOpen) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
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
        onDraftBlur={() => chatApi.setChatDraft(chatId, draftRef.current)}
        onSendEmoji={(emoji) => chatApi.sendEmojiMessage(chatId, emoji)}
        onSendSticker={(key) => chatApi.sendStickerMessage(chatId, key)}
        onSendVoice={(voice) => chatApi.sendVoiceMessage(chatId, voice)}
        onAttachImage={(media) =>
          chatApi.sendMediaMessage(chatId, 'image', {
            fileName: media.fileName,
            mediaUrl: media.uri,
            mimeType: media.mimeType,
          })
        }
        onAttachVideo={(media) =>
          chatApi.sendMediaMessage(chatId, 'video', {
            fileName: media.fileName,
            mediaUrl: media.uri,
            mimeType: media.mimeType,
          })
        }
        onAttachFile={(media) =>
          chatApi.sendMediaMessage(chatId, 'file', {
            fileName: media.fileName,
            mediaUrl: media.uri,
            mimeType: media.mimeType,
          })
        }
        replyLabel={replyTo?.text ?? replyTo?.stickerKey}
        onCancelReply={() => setReplyTo(null)}
      />

      <ActionSheet
        visible={messageMenu !== null}
        title="Message"
        items={messageMenuItems}
        onClose={() => setMessageMenu(null)}
      />

      <DurationPickerSheet
        visible={mutePickerOpen}
        title="Mute notifications"
        showOff={false}
        onClose={() => setMutePickerOpen(false)}
        onSelect={(seconds) => {
          if (seconds !== null) {
            chatApi.muteChat(chat.id, seconds);
          }
        }}
      />

      <DurationPickerSheet
        visible={disappearPickerOpen}
        title="Disappearing messages"
        showOff
        offLabel="Turn off disappearing messages"
        onClose={() => setDisappearPickerOpen(false)}
        onSelect={(seconds) => chatApi.setDisappearingTimer(chat.id, seconds)}
      />
    </View>
  );
}

function formatDurationLabel(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)} hr`;
  }
  return `${Math.round(seconds / 86400)} day`;
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
