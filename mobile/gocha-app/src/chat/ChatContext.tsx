import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  readStoredChatLabels,
  readStoredChatLists,
  readStoredChatPreferences,
  writeStoredChatLabels,
  writeStoredChatLists,
  writeStoredChatPreferences,
} from './chatPreferencesStore';
import {
  readStoredChatDrafts,
  removeStoredChatDraft,
  upsertStoredChatDraft,
  type ChatDraft,
} from './chatDraftsStore';
import {
  EMOJI_GRID,
  STICKER_EMOJI,
  createOrderAssistantChat,
  createOrderAssistantMessages,
} from './seedData';
import {
  listPreviewForMessage,
  mergeMessages,
  previewFromMessages,
  sameMessageList,
} from './messageMapping';
import {
  loadConversationMessages,
  loadConversations,
  markChatReadOnServer,
  openDirectConversation,
  openGroupConversation,
  postEmojiMessage,
  postTextMessage,
} from './conversationApi';
import { isOrderAssistantChat } from './orderAssistant';
import { useAuth } from '../context/AuthContext';
import type {
  ChatFilterId,
  ChatLabel,
  ChatList,
  ChatMessage,
  ChatPreferences,
  ChatRecord,
  MessageType,
  MuteDuration,
  SwipeAction,
} from './types';

type ChatContextValue = {
  chats: ChatRecord[];
  lists: ChatList[];
  labels: ChatLabel[];
  preferences: ChatPreferences;
  messagesFor: (chatId: string) => ChatMessage[];
  getChat: (chatId: string) => ChatRecord | undefined;
  activeFilter: ChatFilterId | string;
  setActiveFilter: (filter: ChatFilterId | string) => void;
  filteredChats: ChatRecord[];
  archivedChats: ChatRecord[];
  hiddenChats: ChatRecord[];
  blockedChats: ChatRecord[];
  selectedChatIds: string[];
  bulkMode: boolean;
  setBulkMode: (value: boolean) => void;
  toggleSelectChat: (chatId: string) => void;
  clearSelection: () => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  unarchiveChat: (chatId: string) => void;
  muteChat: (chatId: string, duration: MuteDuration | number) => void;
  unmuteChat: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  markChatUnread: (chatId: string) => void;
  favoriteChat: (chatId: string) => void;
  unfavoriteChat: (chatId: string) => void;
  blockChat: (chatId: string) => void;
  unblockChat: (chatId: string) => void;
  lockChat: (chatId: string) => void;
  unlockChat: (chatId: string) => void;
  hideChat: (chatId: string) => void;
  unhideChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearChat: (chatId: string) => void;
  addChatToList: (chatId: string, listId: string) => void;
  removeChatFromList: (chatId: string, listId: string) => void;
  createList: (name: string) => string;
  deleteList: (listId: string) => void;
  muteList: (listId: string) => void;
  unmuteList: (listId: string) => void;
  addLabelToChat: (chatId: string, labelId: string) => void;
  removeLabelFromChat: (chatId: string, labelId: string) => void;
  createLabel: (name: string, color: string) => string;
  updateLabel: (labelId: string, updates: { name?: string; color?: string }) => void;
  deleteLabel: (labelId: string) => void;
  setLabelsEnabled: (enabled: boolean) => void;
  setListsEnabled: (enabled: boolean) => void;
  setSwipeRight: (action: SwipeAction) => void;
  setSwipeLeft: (action: SwipeAction) => void;
  setHiddenChatsPin: (pin: string | null) => void;
  setChatLockPin: (pin: string | null) => void;
  verifyHiddenPin: (pin: string) => boolean;
  verifyLockPin: (pin: string) => boolean;
  applySwipeAction: (chatId: string, action: SwipeAction) => void;
  bulkPin: () => void;
  bulkArchive: () => void;
  bulkMute: () => void;
  bulkDelete: () => void;
  bulkMarkRead: () => void;
  openChat: (chatId: string) => void;
  refreshConversations: () => Promise<void>;
  startDirectMessage: (userId: number) => Promise<string>;
  startGroupConversation: (name: string, participantUserIds: number[]) => Promise<string>;
  ensureMessagesLoaded: (chatId: string) => Promise<void>;
  refreshMessagesForChat: (chatId: string) => Promise<void>;
  conversationsLoading: boolean;
  createBroadcast: (name: string) => string;
  sendTextMessage: (chatId: string, text: string, replyToId?: string) => void;
  sendEmojiMessage: (chatId: string, emoji: string) => void;
  sendStickerMessage: (chatId: string, stickerKey: string) => void;
  sendVoiceMessage: (
    chatId: string,
    voice: { durationSec: number; mediaUrl?: string; mimeType?: string },
  ) => void;
  sendMediaMessage: (
    chatId: string,
    type: 'image' | 'video' | 'file',
    media?: { fileName?: string; mediaUrl?: string; mimeType?: string },
  ) => void;
  getChatDraft: (chatId: string) => string;
  getChatDraftUpdatedAt: (chatId: string) => number | null;
  setChatDraft: (chatId: string, text: string) => void;
  clearChatDraft: (chatId: string) => void;
  deleteMessage: (chatId: string, messageId: string, forEveryone?: boolean) => void;
  starMessage: (chatId: string, messageId: string) => void;
  unstarMessage: (chatId: string, messageId: string) => void;
  setDisappearingTimer: (chatId: string, seconds: number | null) => void;
  toggleSecretChat: (chatId: string) => void;
  emojiGrid: string[];
  stickerEmoji: Record<string, string>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function formatTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(): string {
  return new Date().toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function muteUntilFor(duration: MuteDuration): number | null {
  const now = Date.now();
  switch (duration) {
    case '1h':
      return now + 3600000;
    case '8h':
      return now + 8 * 3600000;
    case '1w':
      return now + 7 * 86400000;
    default:
      return null;
  }
}

function activityDateLabel(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const orderAssistantChat = useMemo(() => createOrderAssistantChat(), []);
  const orderAssistantMessages = useMemo(() => createOrderAssistantMessages(), []);
  const [chats, setChats] = useState<ChatRecord[]>([orderAssistantChat]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    [orderAssistantChat.id]: orderAssistantMessages,
  });
  const [lists, setLists] = useState<ChatList[]>(() => readStoredChatLists());
  const [labels, setLabels] = useState<ChatLabel[]>(() => readStoredChatLabels());
  const [preferences, setPreferences] = useState<ChatPreferences>(() => readStoredChatPreferences());
  const [drafts, setDrafts] = useState<Record<string, ChatDraft>>(() => readStoredChatDrafts());
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const loadedMessageChatsRef = useRef<Set<string>>(new Set());
  const messageLoadPromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [activeFilter, setActiveFilter] = useState<ChatFilterId | string>('all');
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    writeStoredChatPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    writeStoredChatLists(lists);
  }, [lists]);

  useEffect(() => {
    writeStoredChatLabels(labels);
  }, [labels]);

  const userIdRef = useRef<number | null>(user?.id ?? null);
  userIdRef.current = user?.id ?? null;

  const refreshConversations = useCallback(async () => {
    if (userIdRef.current === null) {
      setChats([orderAssistantChat]);
      setMessages({ [orderAssistantChat.id]: orderAssistantMessages });
      loadedMessageChatsRef.current = new Set();
      return;
    }

    const isFirstLoad = chatsRef.current.filter((chat) => !isOrderAssistantChat(chat.id)).length === 0;
    if (isFirstLoad) {
      setConversationsLoading(true);
    }
    try {
      const existing = chatsRef.current.filter((chat) => !isOrderAssistantChat(chat.id));
      const apiChats = await loadConversations(existing);
      // Keep local-only chats (e.g. broadcasts) that the server does not know about.
      const apiIds = new Set(apiChats.map((chat) => chat.id));
      const localOnly = existing.filter(
        (chat) => !/^\d+$/.test(chat.id) && !apiIds.has(chat.id),
      );
      setChats([orderAssistantChat, ...apiChats, ...localOnly]);
    } catch {
      // Transient failure; keep the current list and let the next poll retry.
    } finally {
      if (isFirstLoad) {
        setConversationsLoading(false);
      }
    }
  }, [orderAssistantChat, orderAssistantMessages]);

  useEffect(() => {
    // Chats and messages are viewer-relative (isOutgoing, "You:" previews,
    // unread counts). When the signed-in user changes, the previous account's
    // cache must be dropped entirely, not refreshed in place.
    loadedMessageChatsRef.current = new Set();
    deletedMessageIdsRef.current = new Set();
    const freshChats = [orderAssistantChat];
    const freshMessages = { [orderAssistantChat.id]: orderAssistantMessages };
    chatsRef.current = freshChats;
    messagesRef.current = freshMessages;
    setChats(freshChats);
    setMessages(freshMessages);
    void refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshConversations, orderAssistantChat, orderAssistantMessages]);

  const startDirectMessage = useCallback(
    async (userId: number) => {
      const chat = await openDirectConversation(userId);
      setChats((prev) => {
        const assistant = prev.find((item) => isOrderAssistantChat(item.id)) ?? orderAssistantChat;
        const rest = prev.filter(
          (item) => !isOrderAssistantChat(item.id) && item.id !== chat.id,
        );
        return [assistant, chat, ...rest];
      });
      setMessages((prev) => ({ ...prev, [chat.id]: prev[chat.id] ?? [] }));
      return chat.id;
    },
    [orderAssistantChat],
  );

  const startGroupConversation = useCallback(
    async (name: string, participantUserIds: number[]) => {
      const chat = await openGroupConversation(name, participantUserIds);
      setChats((prev) => {
        const assistant = prev.find((item) => isOrderAssistantChat(item.id)) ?? orderAssistantChat;
        const rest = prev.filter(
          (item) => !isOrderAssistantChat(item.id) && item.id !== chat.id,
        );
        return [assistant, chat, ...rest];
      });
      setMessages((prev) => ({ ...prev, [chat.id]: prev[chat.id] ?? [] }));
      return chat.id;
    },
    [orderAssistantChat],
  );

  const updateChat = useCallback((chatId: string, patch: Partial<ChatRecord>) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, ...patch } : chat)),
    );
  }, []);

  const syncChatFromMessages = useCallback(
    (chatId: string, records: ChatMessage[]) => {
      const last = records[records.length - 1];
      if (!last) {
        return;
      }

      const activityAt = last.sentAtMs ?? Date.now();
      updateChat(chatId, {
        preview: listPreviewForMessage(last),
        dateLabel: activityDateLabel(activityAt),
        lastActivityAt: activityAt,
        ...(last.isOutgoing ? { unreadCount: 0 } : {}),
      });
    },
    [updateChat],
  );

  const applyServerMessages = useCallback(
    (chatId: string, records: ChatMessage[]): void => {
      const previous = messagesRef.current[chatId] ?? [];
      const merged = mergeMessages(previous, records, deletedMessageIdsRef.current);
      if (sameMessageList(previous, merged)) {
        return;
      }

      setMessages((prev) => ({ ...prev, [chatId]: merged }));
      syncChatFromMessages(chatId, merged);

      // Only tell the server we read it when a new incoming message arrived
      // while this chat is being actively refreshed (i.e. it is open).
      const previousIds = new Set(previous.map((message) => message.id));
      const hasNewIncoming = records.some(
        (record) => !record.isOutgoing && !previousIds.has(record.id),
      );
      if (hasNewIncoming) {
        updateChat(chatId, { unreadCount: 0, markedUnread: false });
        void markChatReadOnServer(chatId).catch(() => undefined);
      }
    },
    [syncChatFromMessages, updateChat],
  );

  const ensureMessagesLoaded = useCallback(
    async (chatId: string) => {
      if (isOrderAssistantChat(chatId)) return;
      if (loadedMessageChatsRef.current.has(chatId)) return;
      if (!/^\d+$/.test(chatId)) return;

      const inFlight = messageLoadPromisesRef.current.get(chatId);
      if (inFlight) {
        return inFlight;
      }

      const load = (async () => {
        try {
          const records = await loadConversationMessages(chatId, user?.id);
          loadedMessageChatsRef.current.add(chatId);
          applyServerMessages(chatId, records);
        } catch {
          // Leave the chat unloaded so the next open or poll retries.
        } finally {
          messageLoadPromisesRef.current.delete(chatId);
        }
      })();

      messageLoadPromisesRef.current.set(chatId, load);
      return load;
    },
    [applyServerMessages, user?.id],
  );

  const refreshMessagesForChat = useCallback(
    async (chatId: string) => {
      if (isOrderAssistantChat(chatId)) return;
      if (!/^\d+$/.test(chatId)) return;

      try {
        const records = await loadConversationMessages(chatId, user?.id);
        loadedMessageChatsRef.current.add(chatId);
        applyServerMessages(chatId, records);
      } catch {
        // Transient failure; the next poll retries.
      }
    },
    [applyServerMessages, user?.id],
  );

  const getChat = useCallback(
    (chatId: string) => chats.find((chat) => chat.id === chatId),
    [chats],
  );

  const messagesFor = useCallback(
    (chatId: string) => messages[chatId] ?? [],
    [messages],
  );

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      if (isOrderAssistantChat(a.id)) return -1;
      if (isOrderAssistantChat(b.id)) return 1;
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      const aDraft = drafts[a.id]?.text.trim();
      const bDraft = drafts[b.id]?.text.trim();
      if (aDraft && !bDraft) return -1;
      if (!aDraft && bDraft) return 1;
      if (aDraft && bDraft) {
        return (drafts[b.id]?.updatedAt ?? 0) - (drafts[a.id]?.updatedAt ?? 0);
      }

      return b.lastActivityAt - a.lastActivityAt;
    });
  }, [chats, drafts]);

  const filteredChats = useMemo(() => {
    let pool = sortedChats.filter((chat) => !chat.hidden && !chat.archived && !chat.blocked);

    if (activeFilter === 'unread') {
      pool = pool.filter((chat) => chat.unreadCount > 0 || chat.markedUnread);
    } else if (activeFilter === 'groups') {
      pool = pool.filter((chat) => chat.isGroup);
    } else if (activeFilter === 'favorites') {
      pool = pool.filter((chat) => chat.favorite);
    } else if (activeFilter.startsWith('list:')) {
      const listId = activeFilter.replace('list:', '');
      pool = pool.filter((chat) => chat.listIds.includes(listId));
    } else if (activeFilter.startsWith('label:')) {
      const labelId = activeFilter.replace('label:', '');
      pool = pool.filter((chat) => chat.labelIds.includes(labelId));
    }

    return pool;
  }, [activeFilter, sortedChats]);

  const archivedChats = useMemo(
    () => sortedChats.filter((chat) => chat.archived && !chat.hidden),
    [sortedChats],
  );

  const hiddenChats = useMemo(
    () => sortedChats.filter((chat) => chat.hidden),
    [sortedChats],
  );

  const blockedChats = useMemo(
    () => sortedChats.filter((chat) => chat.blocked),
    [sortedChats],
  );

  const pinChat = useCallback(
    (chatId: string) => {
      if (isOrderAssistantChat(chatId)) return;
      updateChat(chatId, { pinned: true });
    },
    [updateChat],
  );
  const unpinChat = useCallback(
    (chatId: string) => {
      if (isOrderAssistantChat(chatId)) return;
      updateChat(chatId, { pinned: false });
    },
    [updateChat],
  );
  const archiveChat = useCallback((chatId: string) => updateChat(chatId, { archived: true }), [updateChat]);
  const unarchiveChat = useCallback((chatId: string) => updateChat(chatId, { archived: false }), [updateChat]);
  const markChatRead = useCallback(
    (chatId: string) => {
      updateChat(chatId, { unreadCount: 0, markedUnread: false });
      if (!isOrderAssistantChat(chatId) && /^\d+$/.test(chatId)) {
        void markChatReadOnServer(chatId).catch(() => undefined);
      }
    },
    [updateChat],
  );
  const markChatUnread = useCallback(
    (chatId: string) => updateChat(chatId, { markedUnread: true }),
    [updateChat],
  );
  const favoriteChat = useCallback((chatId: string) => updateChat(chatId, { favorite: true }), [updateChat]);
  const unfavoriteChat = useCallback((chatId: string) => updateChat(chatId, { favorite: false }), [updateChat]);
  const blockChat = useCallback((chatId: string) => updateChat(chatId, { blocked: true }), [updateChat]);
  const unblockChat = useCallback((chatId: string) => updateChat(chatId, { blocked: false }), [updateChat]);
  const lockChat = useCallback((chatId: string) => updateChat(chatId, { locked: true }), [updateChat]);
  const unlockChat = useCallback((chatId: string) => updateChat(chatId, { locked: false }), [updateChat]);
  const hideChat = useCallback((chatId: string) => updateChat(chatId, { hidden: true }), [updateChat]);
  const unhideChat = useCallback((chatId: string) => updateChat(chatId, { hidden: false }), [updateChat]);

  const muteChat = useCallback(
    (chatId: string, duration: MuteDuration | number) => {
      const muteUntil =
        typeof duration === 'number'
          ? Date.now() + duration * 1000
          : muteUntilFor(duration);
      updateChat(chatId, { muted: true, muteUntil });
    },
    [updateChat],
  );

  const unmuteChat = useCallback(
    (chatId: string) => updateChat(chatId, { muted: false, muteUntil: null }),
    [updateChat],
  );

  const deleteChat = useCallback((chatId: string) => {
    if (isOrderAssistantChat(chatId)) return;
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        chatIds: list.chatIds.filter((id) => id !== chatId),
      })),
    );
  }, []);

  const clearChat = useCallback((chatId: string) => {
    // Remember cleared ids so background refreshes do not resurrect them.
    for (const message of messagesRef.current[chatId] ?? []) {
      deletedMessageIdsRef.current.add(message.id);
    }
    setMessages((prev) => ({ ...prev, [chatId]: [] }));
    updateChat(chatId, { preview: 'Messages cleared', unreadCount: 0 });
  }, [updateChat]);

  const addChatToList = useCallback((chatId: string, listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, chatIds: list.chatIds.includes(chatId) ? list.chatIds : [...list.chatIds, chatId] }
          : list,
      ),
    );
    updateChat(chatId, {
      listIds: [...(getChat(chatId)?.listIds ?? []), listId].filter(
        (id, index, arr) => arr.indexOf(id) === index,
      ),
    });
  }, [getChat, updateChat]);

  const removeChatFromList = useCallback((chatId: string, listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, chatIds: list.chatIds.filter((id) => id !== chatId) }
          : list,
      ),
    );
    updateChat(chatId, {
      listIds: (getChat(chatId)?.listIds ?? []).filter((id) => id !== listId),
    });
  }, [getChat, updateChat]);

  const createList = useCallback((name: string) => {
    const id = `list-${Date.now()}`;
    setLists((prev) => [...prev, { id, name, chatIds: [], muted: false }]);
    return id;
  }, []);

  const deleteList = useCallback((listId: string) => {
    setLists((prev) => prev.filter((list) => list.id !== listId));
    setChats((prev) =>
      prev.map((chat) => ({
        ...chat,
        listIds: chat.listIds.filter((id) => id !== listId),
      })),
    );
  }, []);

  const muteList = useCallback((listId: string) => {
    setLists((prev) => prev.map((list) => (list.id === listId ? { ...list, muted: true } : list)));
  }, []);

  const unmuteList = useCallback((listId: string) => {
    setLists((prev) => prev.map((list) => (list.id === listId ? { ...list, muted: false } : list)));
  }, []);

  const addLabelToChat = useCallback((chatId: string, labelId: string) => {
    const chat = getChat(chatId);
    if (!chat) return;
    updateChat(chatId, {
      labelIds: [...chat.labelIds, labelId].filter((id, i, arr) => arr.indexOf(id) === i),
    });
  }, [getChat, updateChat]);

  const removeLabelFromChat = useCallback((chatId: string, labelId: string) => {
    const chat = getChat(chatId);
    if (!chat) return;
    updateChat(chatId, { labelIds: chat.labelIds.filter((id) => id !== labelId) });
  }, [getChat, updateChat]);

  const createLabel = useCallback((name: string, color: string) => {
    const id = `label-${Date.now()}`;
    setLabels((prev) => [...prev, { id, name, color }]);
    return id;
  }, []);

  const updateLabel = useCallback((labelId: string, updates: { name?: string; color?: string }) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId
          ? {
              ...label,
              ...(updates.name !== undefined ? { name: updates.name.trim() || label.name } : {}),
              ...(updates.color !== undefined ? { color: updates.color } : {}),
            }
          : label,
      ),
    );
  }, []);

  const deleteLabel = useCallback((labelId: string) => {
    setLabels((prev) => prev.filter((label) => label.id !== labelId));
    setChats((prev) =>
      prev.map((chat) => ({
        ...chat,
        labelIds: chat.labelIds.filter((id) => id !== labelId),
      })),
    );
  }, []);

  const setLabelsEnabled = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, labelsEnabled: enabled }));
  }, []);

  const setListsEnabled = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, listsEnabled: enabled }));
    if (!enabled) {
      setActiveFilter('all');
    }
  }, []);

  const setSwipeRight = useCallback((action: SwipeAction) => {
    setPreferences((prev) => ({ ...prev, swipeRight: action }));
  }, []);

  const setSwipeLeft = useCallback((action: SwipeAction) => {
    setPreferences((prev) => ({ ...prev, swipeLeft: action }));
  }, []);

  const setHiddenChatsPin = useCallback((pin: string | null) => {
    setPreferences((prev) => ({ ...prev, hiddenChatsPin: pin }));
  }, []);

  const setChatLockPin = useCallback((pin: string | null) => {
    setPreferences((prev) => ({ ...prev, chatLockPin: pin }));
  }, []);

  const verifyHiddenPin = useCallback(
    (pin: string) => Boolean(preferences.hiddenChatsPin && preferences.hiddenChatsPin === pin),
    [preferences.hiddenChatsPin],
  );

  const verifyLockPin = useCallback(
    (pin: string) => Boolean(preferences.chatLockPin && preferences.chatLockPin === pin),
    [preferences.chatLockPin],
  );

  const applySwipeAction = useCallback(
    (chatId: string, action: SwipeAction) => {
      switch (action) {
        case 'pin':
          const chat = getChat(chatId);
          if (chat?.pinned) unpinChat(chatId);
          else pinChat(chatId);
          break;
        case 'read':
          const c = getChat(chatId);
          if (c && (c.unreadCount > 0 || c.markedUnread)) markChatRead(chatId);
          else markChatUnread(chatId);
          break;
        case 'archive':
          archiveChat(chatId);
          break;
        case 'mute':
          muteChat(chatId, '8h');
          break;
        case 'delete':
          deleteChat(chatId);
          break;
      }
    },
    [archiveChat, deleteChat, getChat, markChatRead, markChatUnread, muteChat, pinChat, unpinChat],
  );

  const toggleSelectChat = useCallback((chatId: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId],
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedChatIds([]), []);

  const bulkPin = useCallback(() => {
    selectedChatIds.forEach((id) => pinChat(id));
    clearSelection();
    setBulkMode(false);
  }, [clearSelection, pinChat, selectedChatIds]);

  const bulkArchive = useCallback(() => {
    selectedChatIds.forEach((id) => archiveChat(id));
    clearSelection();
    setBulkMode(false);
  }, [archiveChat, clearSelection, selectedChatIds]);

  const bulkMute = useCallback(() => {
    selectedChatIds.forEach((id) => muteChat(id, '8h'));
    clearSelection();
    setBulkMode(false);
  }, [clearSelection, muteChat, selectedChatIds]);

  const bulkDelete = useCallback(() => {
    selectedChatIds.forEach((id) => deleteChat(id));
    clearSelection();
    setBulkMode(false);
  }, [clearSelection, deleteChat, selectedChatIds]);

  const bulkMarkRead = useCallback(() => {
    selectedChatIds.forEach((id) => markChatRead(id));
    clearSelection();
    setBulkMode(false);
  }, [clearSelection, markChatRead, selectedChatIds]);

  const openChat = useCallback(
    (chatId: string) => {
      markChatRead(chatId);
      void ensureMessagesLoaded(chatId);
    },
    [ensureMessagesLoaded, markChatRead],
  );

  const createBroadcast = useCallback((name: string): string => {
    const id = `broadcast-${Date.now()}`;
    const trimmed = name.trim() || 'Broadcast';
    const label = trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    const record: ChatRecord = {
      id,
      name: trimmed,
      avatarLabel: label || 'BC',
      avatarColor: '#7c6cf0',
      preview: 'Broadcast list created',
      dateLabel: formatDateLabel(),
      lastActivityAt: Date.now(),
      unreadCount: 0,
      pinned: false,
      archived: false,
      muted: false,
      blocked: false,
      locked: false,
      hidden: false,
      favorite: false,
      markedUnread: false,
      isGroup: true,
      groupCount: 0,
      isBusiness: false,
      isBroadcast: true,
      isSecret: false,
      listIds: [],
      labelIds: [],
    };

    setChats((prev) => [record, ...prev]);
    setMessages((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const getChatDraft = useCallback(
    (chatId: string) => drafts[chatId]?.text ?? '',
    [drafts],
  );

  const getChatDraftUpdatedAt = useCallback(
    (chatId: string) => drafts[chatId]?.updatedAt ?? null,
    [drafts],
  );

  const setChatDraft = useCallback((chatId: string, text: string) => {
    setDrafts((prev) => {
      const trimmed = text.trim();
      if (!trimmed) {
        if (!prev[chatId]) {
          return prev;
        }
        return removeStoredChatDraft(chatId);
      }
      if (prev[chatId]?.text === text) {
        return prev;
      }
      return upsertStoredChatDraft(chatId, text);
    });
  }, []);

  const clearChatDraft = useCallback((chatId: string) => {
    setDrafts(removeStoredChatDraft(chatId));
  }, []);

  const appendMessage = useCallback(
    (chatId: string, message: ChatMessage) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), message],
      }));
      updateChat(chatId, {
        preview: listPreviewForMessage(message),
        dateLabel: activityDateLabel(),
        lastActivityAt: Date.now(),
        ...(message.isOutgoing ? { unreadCount: 0 } : {}),
      });
    },
    [updateChat],
  );

  /**
   * Appends an optimistic message, then reconciles it with the saved server
   * copy. If a background refresh replaced the message list while the POST
   * was in flight, the saved message is appended instead of silently lost.
   */
  const deliverMessage = useCallback(
    (chatId: string, optimistic: ChatMessage, send: () => Promise<ChatMessage>) => {
      appendMessage(chatId, optimistic);

      void send()
        .then((savedRecord) => {
          const saved: ChatMessage = {
            ...savedRecord,
            ...(optimistic.replyToId ? { replyToId: optimistic.replyToId } : {}),
          };
          setMessages((prev) => {
            const current = (prev[chatId] ?? []).filter(
              (message) => message.id !== optimistic.id && message.id !== saved.id,
            );
            return { ...prev, [chatId]: [...current, saved] };
          });
          updateChat(chatId, {
            preview: listPreviewForMessage(saved),
            dateLabel: activityDateLabel(saved.sentAtMs ?? Date.now()),
            lastActivityAt: saved.sentAtMs ?? Date.now(),
            unreadCount: 0,
          });
        })
        .catch(() => {
          setMessages((prev) => {
            const remaining = (prev[chatId] ?? []).filter(
              (message) => message.id !== optimistic.id,
            );
            updateChat(chatId, {
              preview: previewFromMessages(remaining),
            });
            return { ...prev, [chatId]: remaining };
          });
        });
    },
    [appendMessage, updateChat],
  );

  const sendTextMessage = useCallback(
    (chatId: string, text: string, replyToId?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (isOrderAssistantChat(chatId) || !/^\d+$/.test(chatId)) {
        appendMessage(chatId, {
          id: `m-${Date.now()}`,
          type: 'text',
          text: trimmed,
          sentAt: formatTimeLabel(),
          sentAtMs: Date.now(),
          isOutgoing: true,
          status: 'sent',
          replyToId,
        });
        return;
      }

      deliverMessage(
        chatId,
        {
          id: `pending-${Date.now()}`,
          type: 'text',
          text: trimmed,
          sentAt: formatTimeLabel(),
          sentAtMs: Date.now(),
          isOutgoing: true,
          status: 'sent',
          replyToId,
        },
        () => postTextMessage(chatId, trimmed, user?.id),
      );
    },
    [appendMessage, deliverMessage, user?.id],
  );

  const sendEmojiMessage = useCallback(
    (chatId: string, emoji: string) => {
      if (isOrderAssistantChat(chatId) || !/^\d+$/.test(chatId)) {
        appendMessage(chatId, {
          id: `m-${Date.now()}`,
          type: 'emoji',
          text: emoji,
          sentAt: formatTimeLabel(),
          sentAtMs: Date.now(),
          isOutgoing: true,
          status: 'sent',
        });
        return;
      }

      deliverMessage(
        chatId,
        {
          id: `pending-${Date.now()}`,
          type: 'emoji',
          text: emoji,
          sentAt: formatTimeLabel(),
          sentAtMs: Date.now(),
          isOutgoing: true,
          status: 'sent',
        },
        () => postEmojiMessage(chatId, emoji, user?.id),
      );
    },
    [appendMessage, deliverMessage, user?.id],
  );

  const sendStickerMessage = useCallback(
    (chatId: string, stickerKey: string) => {
      const stickerGlyph = STICKER_EMOJI[stickerKey] ?? '⭐';

      if (isOrderAssistantChat(chatId) || !/^\d+$/.test(chatId)) {
        appendMessage(chatId, {
          id: `m-${Date.now()}`,
          type: 'sticker',
          stickerKey,
          sentAt: formatTimeLabel(),
          sentAtMs: Date.now(),
          isOutgoing: true,
          status: 'sent',
        });
        return;
      }

      // Stickers are delivered to the other user as their emoji glyph so the
      // message persists on the server and renders on every platform.
      deliverMessage(
        chatId,
        {
          id: `pending-${Date.now()}`,
          type: 'sticker',
          stickerKey,
          sentAt: formatTimeLabel(),
          sentAtMs: Date.now(),
          isOutgoing: true,
          status: 'sent',
        },
        () => postEmojiMessage(chatId, stickerGlyph, user?.id),
      );
    },
    [appendMessage, deliverMessage, user?.id],
  );

  const sendVoiceMessage = useCallback(
    (
      chatId: string,
      voice: { durationSec: number; mediaUrl?: string; mimeType?: string },
    ) => {
      appendMessage(chatId, {
        id: `m-${Date.now()}`,
        type: 'voice',
        durationSec: voice.durationSec,
        mediaUrl: voice.mediaUrl,
        mimeType: voice.mimeType,
        sentAt: formatTimeLabel(),
        sentAtMs: Date.now(),
        isOutgoing: true,
        status: 'sent',
      });
    },
    [appendMessage],
  );

  const sendMediaMessage = useCallback(
    (
      chatId: string,
      type: MessageType,
      media?: { fileName?: string; mediaUrl?: string; mimeType?: string },
    ) => {
      if (type !== 'image' && type !== 'video' && type !== 'file') return;
      appendMessage(chatId, {
        id: `m-${Date.now()}`,
        type,
        fileName: media?.fileName,
        mediaUrl: media?.mediaUrl,
        mimeType: media?.mimeType,
        sentAt: formatTimeLabel(),
        sentAtMs: Date.now(),
        isOutgoing: true,
        status: 'sent',
      });
    },
    [appendMessage],
  );

  const deleteMessage = useCallback(
    (chatId: string, messageId: string, _forEveryone?: boolean) => {
      // Remember the deletion so background refreshes do not resurrect it.
      deletedMessageIdsRef.current.add(messageId);
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).filter((message) => message.id !== messageId),
      }));
    },
    [],
  );

  const starMessage = useCallback((chatId: string, messageId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).map((message) =>
        message.id === messageId ? { ...message, starred: true } : message,
      ),
    }));
  }, []);

  const unstarMessage = useCallback((chatId: string, messageId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).map((message) =>
        message.id === messageId ? { ...message, starred: false } : message,
      ),
    }));
  }, []);

  const setDisappearingTimer = useCallback(
    (chatId: string, seconds: number | null) => {
      updateChat(chatId, { disappearingTimerSec: seconds });
    },
    [updateChat],
  );

  const toggleSecretChat = useCallback(
    (chatId: string) => {
      const chat = getChat(chatId);
      if (!chat) return;
      updateChat(chatId, { isSecret: !chat.isSecret });
    },
    [getChat, updateChat],
  );

  const value = useMemo(
    () => ({
      chats: sortedChats,
      lists,
      labels,
      preferences,
      messagesFor,
      getChat,
      activeFilter,
      setActiveFilter,
      filteredChats,
      archivedChats,
      hiddenChats,
      blockedChats,
      selectedChatIds,
      bulkMode,
      setBulkMode,
      toggleSelectChat,
      clearSelection,
      pinChat,
      unpinChat,
      archiveChat,
      unarchiveChat,
      muteChat,
      unmuteChat,
      markChatRead,
      markChatUnread,
      favoriteChat,
      unfavoriteChat,
      blockChat,
      unblockChat,
      lockChat,
      unlockChat,
      hideChat,
      unhideChat,
      deleteChat,
      clearChat,
      addChatToList,
      removeChatFromList,
      createList,
      deleteList,
      muteList,
      unmuteList,
      addLabelToChat,
      removeLabelFromChat,
      createLabel,
      updateLabel,
      deleteLabel,
      setLabelsEnabled,
      setListsEnabled,
      setSwipeRight,
      setSwipeLeft,
      setHiddenChatsPin,
      setChatLockPin,
      verifyHiddenPin,
      verifyLockPin,
      applySwipeAction,
      bulkPin,
      bulkArchive,
      bulkMute,
      bulkDelete,
      bulkMarkRead,
      openChat,
      refreshConversations,
      startDirectMessage,
      startGroupConversation,
      ensureMessagesLoaded,
      refreshMessagesForChat,
      conversationsLoading,
      createBroadcast,
      sendTextMessage,
      sendEmojiMessage,
      sendStickerMessage,
      sendVoiceMessage,
      sendMediaMessage,
      getChatDraft,
      getChatDraftUpdatedAt,
      setChatDraft,
      clearChatDraft,
      deleteMessage,
      starMessage,
      unstarMessage,
      setDisappearingTimer,
      toggleSecretChat,
      emojiGrid: EMOJI_GRID,
      stickerEmoji: STICKER_EMOJI,
    }),
    [
      sortedChats,
      lists,
      labels,
      preferences,
      messagesFor,
      getChat,
      activeFilter,
      filteredChats,
      archivedChats,
      hiddenChats,
      blockedChats,
      selectedChatIds,
      bulkMode,
      toggleSelectChat,
      clearSelection,
      pinChat,
      unpinChat,
      archiveChat,
      unarchiveChat,
      muteChat,
      unmuteChat,
      markChatRead,
      markChatUnread,
      favoriteChat,
      unfavoriteChat,
      blockChat,
      unblockChat,
      lockChat,
      unlockChat,
      hideChat,
      unhideChat,
      deleteChat,
      clearChat,
      addChatToList,
      removeChatFromList,
      createList,
      deleteList,
      muteList,
      unmuteList,
      addLabelToChat,
      removeLabelFromChat,
      createLabel,
      updateLabel,
      deleteLabel,
      setLabelsEnabled,
      setListsEnabled,
      setSwipeRight,
      setSwipeLeft,
      setHiddenChatsPin,
      setChatLockPin,
      verifyHiddenPin,
      verifyLockPin,
      applySwipeAction,
      bulkPin,
      bulkArchive,
      bulkMute,
      bulkDelete,
      bulkMarkRead,
      openChat,
      refreshConversations,
      startDirectMessage,
      startGroupConversation,
      ensureMessagesLoaded,
      refreshMessagesForChat,
      conversationsLoading,
      createBroadcast,
      sendTextMessage,
      sendEmojiMessage,
      sendStickerMessage,
      sendVoiceMessage,
      sendMediaMessage,
      getChatDraft,
      getChatDraftUpdatedAt,
      setChatDraft,
      clearChatDraft,
      deleteMessage,
      starMessage,
      unstarMessage,
      setDisappearingTimer,
      toggleSecretChat,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
