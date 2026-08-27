import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  AccountSwitcherMenu,
  AnimatedHamburgerMenu,
  ConfirmDialog,
  DropdownMenu,
  SearchField,
  type DropdownMenuItem,
} from '../../components/app';
import { BrandLogo } from '../../components/brand';
import {
  ActionSheet,
  ChatFilterBar,
  SwipeableChatListItem,
  type ActionSheetItem,
} from '../../components/chat';
import { useChat } from '../../chat/ChatContext';
import type { ChatRecord } from '../../chat/types';
import { useAccounts } from '../../context/AccountsContext';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList, RootTabParamList } from '../../navigation/types';

type ChatsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ChatsStackParamList, 'ChatsList'>,
  BottomTabNavigationProp<RootTabParamList>
>;

export function ChatsScreen() {
  const navigation = useNavigation<ChatsNavigationProp>();
  const { theme } = useGochaTheme();
  const insets = useSafeAreaInsets();
  const chat = useChat();
  const { accounts, activeAccountId, switchAccount, beginAddAccount } = useAccounts();
  const { refresh } = useAuth();
  const searchRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [contextChat, setContextChat] = useState<ChatRecord | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [listPickerChat, setListPickerChat] = useState<ChatRecord | null>(null);
  const [clearTarget, setClearTarget] = useState<ChatRecord | null>(null);

  const accountMenuTop = insets.top + 12 + 44;

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

  const headerMenuItems: DropdownMenuItem[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: 'chatbubble-outline',
      onPress: () => {
        setHeaderMenuOpen(false);
        setComposeOpen(true);
        searchRef.current?.focus();
      },
    },
    {
      id: 'new-group',
      label: 'New Group',
      icon: 'people-outline',
      onPress: () => {
        setHeaderMenuOpen(false);
        navigation.navigate('CreateGroup');
      },
    },
    {
      id: 'new-broadcast',
      label: 'New Broadcast',
      icon: 'megaphone-outline',
      onPress: () => {
        setHeaderMenuOpen(false);
        navigation.navigate('NewBroadcast');
      },
    },
  ];

  function buildContextItems(record: ChatRecord): ActionSheetItem[] {
    const items: ActionSheetItem[] = [
      {
        id: 'profile',
        label: 'View Profile',
        onPress: () => navigation.navigate('ChatInfo', { chatId: record.id }),
      },
      record.markedUnread || record.unreadCount > 0
        ? { id: 'read', label: 'Mark as Read', onPress: () => chat.markChatRead(record.id) }
        : { id: 'unread', label: 'Mark as Unread', onPress: () => chat.markChatUnread(record.id) },
      record.locked
        ? { id: 'unlock', label: 'Unlock Chat', onPress: () => chat.unlockChat(record.id) }
        : { id: 'lock', label: 'Lock Chat', onPress: () => chat.lockChat(record.id) },
      record.favorite
        ? { id: 'unfav', label: 'Remove from Favorites', onPress: () => chat.unfavoriteChat(record.id) }
        : { id: 'fav', label: 'Add to Favorites', onPress: () => chat.favoriteChat(record.id) },
      {
        id: 'lists',
        label: 'Add to List',
        onPress: () => setListPickerChat(record),
      },
      {
        id: 'clear',
        label: 'Clear Chat',
        destructive: true,
        onPress: () => setClearTarget(record),
      },
      record.blocked
        ? { id: 'unblock', label: 'Unblock', onPress: () => chat.unblockChat(record.id) }
        : { id: 'block', label: 'Block', onPress: () => chat.blockChat(record.id) },
    ];

    return items;
  }

  const listPickerItems: ActionSheetItem[] = listPickerChat
    ? chat.lists.map((list) => ({
        id: list.id,
        label: listPickerChat.listIds.includes(list.id)
          ? `Remove from ${list.name}`
          : `Add to ${list.name}`,
        onPress: () => {
          if (listPickerChat.listIds.includes(list.id)) {
            chat.removeChatFromList(listPickerChat.id, list.id);
          } else {
            chat.addChatToList(listPickerChat.id, list.id);
          }
        },
      }))
    : [];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.topSection, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          {chat.activeFilter === 'archived' ? (
            <Pressable onPress={() => chat.setActiveFilter('all')} style={styles.archiveBack}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>All chats</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setAccountMenuOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Switch account"
              style={styles.logoButton}>
              <BrandLogo size={40} />
              <Ionicons name="chevron-down" size={14} color={theme.colors.primary} />
            </Pressable>
          )}
          <AnimatedHamburgerMenu
            open={headerMenuOpen}
            onPress={() => setHeaderMenuOpen((value) => !value)}
            strokeColor={theme.colors.primary}
            size={40}
          />
        </View>

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

      {chat.activeFilter === 'archived' ? (
        <View style={styles.filterBanner}>
          <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans }}>
            Archived conversations
          </Text>
        </View>
      ) : chat.preferences.listsEnabled ? (
        <ChatFilterBar
          onManageLists={() => navigation.navigate('ChatListsSettings')}
          onOpenHidden={() => navigation.navigate('HiddenChats')}
        />
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

      <DropdownMenu
        visible={headerMenuOpen}
        items={headerMenuItems}
        onClose={() => setHeaderMenuOpen(false)}
      />

      <AccountSwitcherMenu
        visible={accountMenuOpen}
        accounts={accounts}
        activeAccountId={activeAccountId}
        menuTop={accountMenuTop}
        onClose={() => setAccountMenuOpen(false)}
        onSelectAccount={async (userId) => {
          if (userId === activeAccountId) return;
          switchAccount(userId);
          await refresh();
        }}
        onAddAccount={() => beginAddAccount()}
        onManageAccounts={() => {
          navigation.navigate('SettingsTab', { screen: 'Accounts' });
        }}
      />

      <ActionSheet
        visible={contextChat !== null}
        title={contextChat?.name}
        items={contextChat ? buildContextItems(contextChat) : []}
        onClose={() => setContextChat(null)}
      />

      <ActionSheet
        visible={listPickerChat !== null}
        title="Add to list"
        items={listPickerItems}
        onClose={() => setListPickerChat(null)}
      />

      <ConfirmDialog
        visible={clearTarget !== null}
        title="Clear chat?"
        message="This permanently deletes all messages in this conversation. This cannot be undone."
        confirmLabel="Clear permanently"
        destructive
        onConfirm={() => {
          if (clearTarget) {
            chat.clearChat(clearTarget.id);
          }
        }}
        onCancel={() => setClearTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  archiveBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  filterBanner: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: { paddingBottom: 8 },
  archiveBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
