import {
  actOnConversationMessage,
  deleteConversationMessage,
  createConversation,
  createGroupConversation,
  fetchConversation,
  fetchConversationMessages,
  fetchConversationTyping,
  fetchConversations,
  markConversationRead,
  postConversationTyping,
  sendConversationImageMessage,
  sendConversationMessage,
  sendGroupPost,
  type ConversationRecord,
  type ConversationTypingUser,
  type GroupPostInput,
} from '../api/client';
import { mapMessageRecord } from './messageMapping';
import { isOrderAssistantChat } from './orderAssistant';
import type { ChatRecord } from './types';

const RECENT_LOCAL_MS = 30_000;

function formatDateLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export function mapConversationRecord(
  record: ConversationRecord,
  existing?: ChatRecord,
): ChatRecord {
  const apiLastActivityAt = record.lastActivityAt
    ? new Date(record.lastActivityAt).getTime()
    : Date.now();

  const existingActivity = existing?.lastActivityAt ?? 0;
  const lastActivityAt = Math.max(apiLastActivityAt, existingActivity);
  const useApiMeta = apiLastActivityAt >= existingActivity;

  return {
    id: String(record.id),
    name: record.name,
    avatarLabel: record.avatarLabel,
    avatarColor: record.avatarColor,
    preview: useApiMeta ? record.preview : (existing?.preview ?? record.preview),
    dateLabel: useApiMeta
      ? formatDateLabel(record.lastActivityAt)
      : (existing?.dateLabel ?? formatDateLabel(record.lastActivityAt)),
    lastActivityAt,
    unreadCount: record.unreadCount,
    pinned: existing?.pinned ?? false,
    archived: existing?.archived ?? false,
    muted: existing?.muted ?? false,
    muteUntil: existing?.muteUntil ?? null,
    blocked: existing?.blocked ?? false,
    locked: existing?.locked ?? false,
    hidden: existing?.hidden ?? false,
    favorite: existing?.favorite ?? false,
    markedUnread: existing?.markedUnread ?? false,
    isGroup: record.type === 'group' || record.isGroup === true,
    groupCount: record.groupCount ?? existing?.groupCount,
    isBusiness: record.isBusiness,
    isSecret: existing?.isSecret ?? false,
    listIds: existing?.listIds ?? [],
    labelIds: existing?.labelIds ?? [],
    otherUserId: record.otherUserId ?? undefined,
    hasStatus: record.hasStatus ?? existing?.hasStatus ?? false,
    statusUnseen: record.statusUnseen ?? existing?.statusUnseen ?? false,
  };
}

export async function loadConversations(existing: ChatRecord[]): Promise<ChatRecord[]> {
  const records = await fetchConversations();
  const byId = new Map(existing.map((chat) => [chat.id, chat]));

  return records.map((record) =>
    mapConversationRecord(record, byId.get(String(record.id))),
  );
}

export async function loadConversation(chatId: string): Promise<ChatRecord> {
  const record = await fetchConversation(Number(chatId));
  return mapConversationRecord(record);
}

/**
 * Apply a conversation list fetch without dropping a thread that was created
 * after the request started. Stale in-flight refreshes were wiping new groups
 * and leaving ChatDetail with nothing to render.
 */
export function mergeConversationLists(
  assistant: ChatRecord,
  apiChats: ChatRecord[],
  current: ChatRecord[],
  idsAtFetchStart: ReadonlySet<string>,
  now = Date.now(),
): ChatRecord[] {
  const apiIds = new Set(apiChats.map((chat) => chat.id));
  const keep = current.filter((chat) => {
    if (isOrderAssistantChat(chat.id) || apiIds.has(chat.id)) {
      return false;
    }
    if (!/^\d+$/.test(chat.id)) {
      return true;
    }
    return !idsAtFetchStart.has(chat.id) || now - chat.lastActivityAt < RECENT_LOCAL_MS;
  });

  return [assistant, ...apiChats, ...keep];
}

export async function loadConversationMessages(
  chatId: string,
  viewerUserId?: number | null,
) {
  const records = await fetchConversationMessages(Number(chatId));
  return records.map((record) => mapMessageRecord(record, viewerUserId));
}

export async function openDirectConversation(userId: number): Promise<ChatRecord> {
  const record = await createConversation(userId);
  return mapConversationRecord(record);
}

export async function openGroupConversation(
  name: string,
  participantUserIds: number[],
): Promise<ChatRecord> {
  const record = await createGroupConversation({ name, participantUserIds });
  return mapConversationRecord(record);
}

export async function postTextMessage(
  chatId: string,
  text: string,
  viewerUserId?: number | null,
) {
  const record = await sendConversationMessage(Number(chatId), text);
  return mapMessageRecord(record, viewerUserId);
}

export async function postEmojiMessage(
  chatId: string,
  emoji: string,
  viewerUserId?: number | null,
) {
  const record = await sendConversationMessage(Number(chatId), emoji, 'emoji');
  return mapMessageRecord(record, viewerUserId);
}

export async function postImageMessage(
  chatId: string,
  file: Blob,
  options: { fileName: string; mimeType: string; text?: string },
  viewerUserId?: number | null,
) {
  const record = await sendConversationImageMessage(Number(chatId), file, options);
  return mapMessageRecord(record, viewerUserId);
}

export async function postGroupPost(
  chatId: string,
  input: GroupPostInput,
  viewerUserId?: number | null,
) {
  const record = await sendGroupPost(Number(chatId), input);
  return mapMessageRecord(record, viewerUserId);
}

export async function deleteChatMessage(
  chatId: string,
  messageId: string,
  scope: 'me' | 'everyone',
): Promise<void> {
  if (!/^\d+$/.test(chatId) || !/^\d+$/.test(messageId)) {
    return;
  }
  await deleteConversationMessage(Number(chatId), messageId, scope);
}

export async function actOnGroupPost(
  chatId: string,
  messageId: string,
  action: 'claim' | 'unclaim' | 'taken' | 'release' | 'vote' | 'close',
  choice?: string,
  viewerUserId?: number | null,
) {
  const record = await actOnConversationMessage(Number(chatId), messageId, action, choice);
  return mapMessageRecord(record, viewerUserId);
}

export async function markChatReadOnServer(chatId: string): Promise<void> {
  await markConversationRead(Number(chatId));
}

export async function signalChatTyping(chatId: string, typing: boolean): Promise<void> {
  if (!/^\d+$/.test(chatId)) {
    return;
  }
  await postConversationTyping(Number(chatId), typing);
}

export async function loadChatTyping(chatId: string): Promise<ConversationTypingUser[]> {
  if (!/^\d+$/.test(chatId)) {
    return [];
  }
  return fetchConversationTyping(Number(chatId));
}
