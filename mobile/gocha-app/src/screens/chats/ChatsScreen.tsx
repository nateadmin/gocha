import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, SearchField } from '../../components/app';
import { BrandLogo } from '../../components/brand';
import {
  ActionSheet,
  ChatFilterBar,
  SwipeableChatListItem,
  type ActionSheetItem,
} from '../../components/chat';
import { useChat } from '../../chat/ChatContext';
import type { ChatRecord } from '../../chat/types';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList } from '../../navigation/types';

export function ChatsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'ChatsList'>>();
  const { theme } = useGochaTheme();
  const insets = useSafeAreaInsets();
  const chat = useChat();
  const searchRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [contextChat, setContextChat] = useState<ChatRecord | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const listData = useMemo(() => {
    if (chat.activeFilter === 'archived') return chat.archivedChats;
    return chat.filteredChats;
  }, [chat.activeFilter, chat.archivedChats, chat.filteredChats]);

  const filtered = listData.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) || item.preview.toLowerCase().includes(q)
    );
  });

  function openChat(chatId: string) {
    chat.openChat(chatId);
    navigation.navigate('ChatDetail', { chatId });
  }

  function buildContextItems(record: ChatRecord): ActionSheetItem[] {
    const items: ActionSheetItem[] = [
      {
        id: 'open',
        label: 'Open chat',
        onPress: () => openChat(record.id),
      },
      {
        id: 'select',
        label: 'Select',
        onPress: () => {
          chat.setBulkMode(true);
          chat.toggleSelectChat(record.id);
        },
      },
      record.pinned
        ? { id: 'unpin', label: 'Unpin', onPress: () => chat.unpinChat(record.id) }
        : { id: 'pin', label: 'Pin', onPress: () => chat.pinChat(record.id) },
      record.markedUnread || record.unreadCount > 0
        ? { id: 'read', label: 'Mark as read', onPress: () => chat.markChatRead(record.id) }
        : { id: 'unread', label: 'Mark as unread', onPress: () => chat.markChatUnread(record.id) },
      record.favorite
        ? { id: 'unfav', label: 'Remove from favorites', onPress: () => chat.unfavoriteChat(record.id) }
        : { id: 'fav', label: 'Add to favorites', onPress: () => chat.favoriteChat(record.id) },
      record.archived
        ? { id: 'unarchive', label: 'Unarchive', onPress: () => chat.unarchiveChat(record.id) }
        : { id: 'archive', label: 'Archive', onPress: () => chat.archiveChat(record.id) },
      record.muted
        ? { id: 'unmute', label: 'Unmute', onPress: () => chat.unmuteChat(record.id) }
        : {
            id: 'mute',
            label: 'Mute 8 hours',
            onPress: () => chat.muteChat(record.id, '8h'),
          },
      record.locked
        ? { id: 'unlock', label: 'Unlock chat', onPress: () => chat.unlockChat(record.id) }
        : { id: 'lock', label: 'Lock chat', onPress: () => chat.lockChat(record.id) },
      record.hidden
        ? { id: 'unhide', label: 'Show in chat list', onPress: () => chat.unhideChat(record.id) }
        : { id: 'hide', label: 'Hide chat', onPress: () => chat.hideChat(record.id) },
      {
        id: 'clear',
        label: 'Clear chat',
        onPress: () => chat.clearChat(record.id),
      },
      {
        id: 'lists',
        label: 'Add to list',
        onPress: () => {
          const firstList = chat.lists[0];
          if (firstList) chat.addChatToList(record.id, firstList.id);
        },
      },
    ];

    if (chat.preferences.labelsEnabled) {
      chat.labels.forEach((label) => {
        const has = record.labelIds.includes(label.id);
        items.push({
          id: `label-${label.id}`,
          label: has ? `Remove label ${label.name}` : `Add label ${label.name}`,
          onPress: () =>
            has
              ? chat.removeLabelFromChat(record.id, label.id)
              : chat.addLabelToChat(record.id, label.id),
        });
      });
    }

    items.push(
      record.blocked
        ? { id: 'unblock', label: 'Unblock', onPress: () => chat.unblockChat(record.id) }
        : { id: 'block', label: 'Block', onPress: () => chat.blockChat(record.id) },
      {
        id: 'delete',
        label: 'Delete chat',
        destructive: true,
        onPress: () => chat.deleteChat(record.id),
      },
    );

    return items;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BrandLogo size={56} />
        <View style={styles.headerActions}>
          <IconButton
            icon="checkbox-outline"
            accessibilityLabel="Bulk select"
            onPress={() => chat.setBulkMode(!chat.bulkMode)}
          />
          <IconButton icon="camera-outline" accessibilityLabel="Camera" />
          <IconButton
            icon="create-outline"
            tone="primary"
            accessibilityLabel="New message"
            onPress={() => {
              setComposeOpen(true);
              searchRef.current?.focus();
            }}
          />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchField
          ref={searchRef}
          value={query}
          onChangeText={setQuery}
          placeholder={
            composeOpen
              ? 'Search name, email, or phone'
              : 'Search conversations'
          }
        />
      </View>

      {chat.preferences.listsEnabled ? (
        <ChatFilterBar
          onManageLists={() => navigation.navigate('ChatListsSettings')}
          onOpenHidden={() => navigation.navigate('HiddenChats')}
        />
      ) : null}

      {chat.bulkMode ? (
        <View
          style={[
            styles.bulkBar,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}>
          <Text style={{ color: theme.colors.cardForeground, fontSize: 13 }}>
            {chat.selectedChatIds.length} selected
          </Text>
          <View style={styles.bulkActions}>
            <Pressable onPress={chat.bulkMarkRead}>
              <Text style={{ color: theme.colors.primary }}>Read</Text>
            </Pressable>
            <Pressable onPress={chat.bulkPin}>
              <Text style={{ color: theme.colors.primary }}>Pin</Text>
            </Pressable>
            <Pressable onPress={chat.bulkArchive}>
              <Text style={{ color: theme.colors.primary }}>Archive</Text>
            </Pressable>
            <Pressable onPress={chat.bulkMute}>
              <Text style={{ color: theme.colors.primary }}>Mute</Text>
            </Pressable>
            <Pressable onPress={chat.bulkDelete}>
              <Text style={{ color: theme.colors.destructive }}>Delete</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                chat.clearSelection();
                chat.setBulkMode(false);
              }}>
              <Text style={{ color: theme.colors.mutedForeground }}>Done</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: theme.colors.card, flex: 1 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          chat.archivedChats.length > 0 && chat.activeFilter === 'all' ? (
            <Pressable
              onPress={() => chat.setActiveFilter('archived')}
              style={styles.archiveBanner}>
              <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>
                Archived ({chat.archivedChats.length})
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <SwipeableChatListItem
            chat={item}
            selected={chat.selectedChatIds.includes(item.id)}
            onPress={() => {
              if (chat.bulkMode) {
                chat.toggleSelectChat(item.id);
                return;
              }
              if (item.locked) {
                navigation.navigate('ChatLock', { chatId: item.id });
                return;
              }
              openChat(item.id);
            }}
            onLongPress={() => setContextChat(item)}
          />
        )}
      />

      <ActionSheet
        visible={contextChat !== null}
        title={contextChat?.name}
        items={contextChat ? buildContextItems(contextChat) : []}
        onClose={() => setContextChat(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 4 },
  list: { paddingBottom: 8 },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bulkActions: { flexDirection: 'row', gap: 12 },
  archiveBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
