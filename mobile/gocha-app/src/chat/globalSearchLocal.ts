import type { ChatRecord } from './types';

export function searchLocalConversations(chats: ChatRecord[], query: string): ChatRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  return chats.filter(
    (chat) =>
      !chat.hidden &&
      !chat.blocked &&
      (chat.name.toLowerCase().includes(needle) || chat.preview.toLowerCase().includes(needle)),
  );
}

export function searchLocalContacts(
  chats: ChatRecord[],
  query: string,
  excludeConversationIds: Set<string>,
): ChatRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  return chats.filter(
    (chat) =>
      !chat.hidden &&
      !chat.blocked &&
      !chat.isGroup &&
      chat.otherUserId &&
      !excludeConversationIds.has(chat.id) &&
      chat.name.toLowerCase().includes(needle),
  );
}
