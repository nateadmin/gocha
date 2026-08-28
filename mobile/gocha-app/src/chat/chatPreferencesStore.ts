import type { ChatLabel, ChatList, ChatPreferences } from './types';

const PREFS_KEY = 'gocha.chat.preferences.v1';
const LISTS_KEY = 'gocha.chat.lists.v1';
const LABELS_KEY = 'gocha.chat.labels.v1';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export const DEFAULT_CHAT_PREFERENCES: ChatPreferences = {
  labelsEnabled: true,
  listsEnabled: true,
  swipeRight: 'pin',
  swipeLeft: 'archive',
  hiddenChatsPin: null,
  chatLockPin: null,
  showArchived: true,
};

export function readStoredChatPreferences(): ChatPreferences {
  if (!canUseStorage()) {
    return DEFAULT_CHAT_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return DEFAULT_CHAT_PREFERENCES;
    }
    return { ...DEFAULT_CHAT_PREFERENCES, ...(JSON.parse(raw) as Partial<ChatPreferences>) };
  } catch {
    return DEFAULT_CHAT_PREFERENCES;
  }
}

export function writeStoredChatPreferences(preferences: ChatPreferences): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
}

export function readStoredChatLists(): ChatList[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(LISTS_KEY);
    return raw ? (JSON.parse(raw) as ChatList[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredChatLists(lists: ChatList[]): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export function readStoredChatLabels(): ChatLabel[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(LABELS_KEY);
    return raw ? (JSON.parse(raw) as ChatLabel[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredChatLabels(labels: ChatLabel[]): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
}
