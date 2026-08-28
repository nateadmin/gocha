import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  AccountLogoButton,
  AccountSwitcherMenu,
  ConfirmDialog,
  HeaderOverflowMenu,
  SearchField,
  type DropdownMenuItem,
} from '../../components/app';
import {
  ActionSheet,
  ChatFilterBar,
  GlobalSearchResults,
  SwipeableChatListItem,
  type ActionSheetItem,
} from '../../components/chat';
import { useChat } from '../../chat/ChatContext';
import {
  searchLocalContacts,
  searchLocalConversations,
} from '../../chat/globalSearchLocal';
import type { ChatRecord } from '../../chat/types';
import { useAccounts } from '../../context/AccountsContext';
import { useAuth } from '../../context/AuthContext';
import {
  globalSearch,
  type GlobalSearchContactResult,
  type GlobalSearchMessageResult,
  type PublicUserProfile,
} from '../../api/client';
import { useGochaTheme } from '../../theme';
import type { ChatsStackParamList, RootTabParamList } from '../../navigation/types';

type ChatsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ChatsStackParamList, 'ChatsList'>,
  BottomTabNavigationProp<RootTabParamList>
>;

const SEARCH_VERTICAL_PADDING = 10;

export function ChatsScreen() {
  const navigation = useNavigation<ChatsNavigationProp>();
  const { theme } = useGochaTheme();
  const insets = useSafeAreaInsets();
  const chat = useChat();
  const { accounts, activeAccountId, switchAccount, beginAddAccount } = useAccounts();
  const { user, refresh } = useAuth();
  const searchRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [contextChat, setContextChat] = useState<ChatRecord | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [listPickerChat, setListPickerChat] = useState<ChatRecord | null>(null);
  const [clearTarget, setClearTarget] = useState<ChatRecord | null>(null);
  const [remoteContacts, setRemoteContacts] = useState<GlobalSearchContactResult[]>([]);
  const [messageResults, setMessageResults] = useState<GlobalSearchMessageResult[]>([]);
  const [peopleResults, setPeopleResults] = useState<PublicUserProfile[]>([]);
  const [remoteSearchLoading, setRemoteSearchLoading] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<number | null>(null);

  const accountMenuTop = insets.top + 12 + 44;
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setRemoteContacts([]);
      setMessageResults([]);
      setPeopleResults([]);
      setRemoteSearchLoading(false);
      return;
    }

    const handle = setTimeout(() => {
      setRemoteSearchLoading(true);
      globalSearch(trimmedQuery)
        .then((payload) => {
          setRemoteContacts(payload.contacts);
          setMessageResults(payload.messages);
          setPeopleResults(payload.people);
        })
        .catch(() => {
          setRemoteContacts([]);
          setMessageResults([]);
          setPeopleResults([]);
        })
        .finally(() => setRemoteSearchLoading(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [trimmedQuery]);

  const switcherAccounts = useMemo(() => {
    const withLiveProfile = accounts.map((account) => {
      if (!user || account.userId !== user.id) {
        return account;
      }

      return {
        ...account,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        label: user.email ?? user.phone ?? account.label,
      };
    });

    if (!user) {
      return withLiveProfile;
    }

    if (withLiveProfile.some((account) => account.userId === user.id)) {
      return withLiveProfile;
    }

    return [
      {
        userId: user.id,
        label: user.email ?? user.phone ?? 'This device',
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        deviceToken: '',
        primaryLoginChannel: user.primaryLoginChannel,
      },
      ...withLiveProfile,
    ];
  }, [accounts, user]);

  const listData = useMemo(() => {
    if (chat.activeFilter === 'archived') return chat.archivedChats;
    return chat.filteredChats;
  }, [chat.activeFilter, chat.archivedChats, chat.filteredChats]);

  const searchableChats = useMemo(
    () => [...chat.filteredChats, ...chat.archivedChats],
    [chat.archivedChats, chat.filteredChats],
  );

  const conversationResults = useMemo(
    () => searchLocalConversations(searchableChats, trimmedQuery),
    [searchableChats, trimmedQuery],
  );

  const localContactResults = useMemo(() => {
    const excludeIds = new Set(conversationResults.map((item) => item.id));
    return searchLocalContacts(searchableChats, trimmedQuery, excludeIds);
  }, [conversationResults, searchableChats, trimmedQuery]);

  async function startChatWithUser(profile: PublicUserProfile) {
    setStartingChatUserId(profile.id);
    try {
      const chatId = await chat.startDirectMessage(profile.id);
      setQuery('');
      openChat(chatId);
    } finally {
      setStartingChatUserId(null);
    }
  }

  function openChat(chatId: string) {
    chat.openChat(chatId);
    navigation.navigate('ChatDetail', { chatId });
  }

  function openConversationById(conversationId: number) {
    openChat(String(conversationId));
  }

  const headerMenuItems: DropdownMenuItem[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: 'chatbubble-outline',
      onPress: () => {
        setHeaderMenuOpen(false);
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
      record.hidden
        ? { id: 'unhide', label: 'Unhide chat', onPress: () => chat.unhideChat(record.id) }
        : { id: 'hide', label: 'Hide chat', onPress: () => chat.hideChat(record.id) },
      record.pinned
        ? { id: 'unpin', label: 'Unpin', onPress: () => chat.unpinChat(record.id) }
        : { id: 'pin', label: 'Pin', onPress: () => chat.pinChat(record.id) },
      record.archived
        ? { id: 'unarchive', label: 'Unarchive', onPress: () => chat.unarchiveChat(record.id) }
        : { id: 'archive', label: 'Archive', onPress: () => chat.archiveChat(record.id) },
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
        <View
          style={[
            styles.header,
            accountMenuOpen
              ? { position: 'relative', zIndex: theme.overlayMenu.headerZIndex + 2 }
              : null,
          ]}>
          {chat.activeFilter === 'archived' ? (
            <Pressable onPress={() => chat.setActiveFilter('all')} style={styles.archiveBack}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>All chats</Text>
            </Pressable>
          ) : (
            <AccountLogoButton onPress={() => setAccountMenuOpen(true)} />
          )}
          <HeaderOverflowMenu
            open={headerMenuOpen}
            menuTop={accountMenuTop}
            items={headerMenuItems}
            onPress={() => setHeaderMenuOpen((value) => !value)}
            onClose={() => setHeaderMenuOpen(false)}
            strokeColor={theme.colors.primary}
          />
        </View>

        <View style={styles.searchBlock}>
          <SearchField
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats, messages, and people"
          />
        </View>
      </View>

      {!isSearching && chat.activeFilter === 'archived' ? (
        <View style={styles.filterBanner}>
          <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans }}>
            Archived conversations
          </Text>
        </View>
      ) : null}

      {!isSearching && chat.activeFilter !== 'archived' ? (
        <ChatFilterBar
          onManageLists={() => navigation.navigate('ChatListsSettings')}
          onOpenHidden={() => navigation.navigate('HiddenChats')}
        />
      ) : null}

      {isSearching ? (
        <GlobalSearchResults
          query={query}
          conversations={conversationResults}
          contacts={remoteContacts}
          localContacts={localContactResults}
          messages={messageResults}
          people={peopleResults}
          loading={remoteSearchLoading}
          startingChatUserId={startingChatUserId}
          onOpenChat={openChat}
          onOpenContact={openConversationById}
          onOpenMessage={openConversationById}
          onStartChatWithPerson={startChatWithUser}
          onLongPressChat={setContextChat}
        />
      ) : (
        <FlatList
          data={listData}
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
      )}

      <AccountSwitcherMenu
        visible={accountMenuOpen}
        accounts={switcherAccounts}
        activeAccountId={activeAccountId ?? user?.id ?? null}
        menuTop={accountMenuTop}
        onClose={() => setAccountMenuOpen(false)}
        onSelectAccount={async (userId) => {
          const currentId = activeAccountId ?? user?.id ?? null;
          if (userId === currentId) return;
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  searchBlock: {
    paddingVertical: SEARCH_VERTICAL_PADDING,
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
