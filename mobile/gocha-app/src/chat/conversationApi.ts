import {
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  type ConversationRecord,
} from '../api/client';
import { mapMessageRecord } from './messageMapping';
import type { ChatRecord } from './types';

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
    isGroup: false,
    isBusiness: record.isBusiness,
    isSecret: existing?.isSecret ?? false,
    listIds: existing?.listIds ?? [],
    labelIds: existing?.labelIds ?? [],
    otherUserId: record.otherUserId ?? undefined,
  };
}

export async function loadConversations(existing: ChatRecord[]): Promise<ChatRecord[]> {
  const records = await fetchConversations();
  const byId = new Map(existing.map((chat) => [chat.id, chat]));

  return records.map((record) =>
    mapConversationRecord(record, byId.get(String(record.id))),
  );
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

export async function markChatReadOnServer(chatId: string): Promise<void> {
  await markConversationRead(Number(chatId));
}
