import {
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  type ConversationMessageRecord,
  type ConversationRecord,
} from '../api/client';
import type { ChatMessage, ChatRecord } from './types';

function formatDateLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function formatTimeLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function mapConversationRecord(
  record: ConversationRecord,
  existing?: ChatRecord,
): ChatRecord {
  const apiLastActivityAt = record.lastActivityAt
    ? new Date(record.lastActivityAt).getTime()
    : Date.now();

  const useExistingActivity =
    existing !== undefined && existing.lastActivityAt >= apiLastActivityAt;

  return {
    id: String(record.id),
    name: record.name,
    avatarLabel: record.avatarLabel,
    avatarColor: record.avatarColor,
    preview: useExistingActivity ? existing.preview : record.preview,
    dateLabel: useExistingActivity
      ? existing.dateLabel
      : formatDateLabel(record.lastActivityAt),
    lastActivityAt: useExistingActivity ? existing.lastActivityAt : apiLastActivityAt,
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

export function mapMessageRecord(record: ConversationMessageRecord): ChatMessage {
  return {
    id: record.id,
    type: record.type === 'emoji' ? 'emoji' : 'text',
    text: record.text ?? undefined,
    sentAt: formatTimeLabel(record.sentAt),
    isOutgoing: record.isOutgoing,
    status: record.status ?? 'sent',
  };
}

export async function loadConversations(existing: ChatRecord[]): Promise<ChatRecord[]> {
  const records = await fetchConversations();
  const byId = new Map(existing.map((chat) => [chat.id, chat]));

  return records.map((record) =>
    mapConversationRecord(record, byId.get(String(record.id))),
  );
}

export async function loadConversationMessages(chatId: string): Promise<ChatMessage[]> {
  const records = await fetchConversationMessages(Number(chatId));
  return records.map(mapMessageRecord);
}

export async function openDirectConversation(userId: number): Promise<ChatRecord> {
  const record = await createConversation(userId);
  return mapConversationRecord(record);
}

export async function postTextMessage(chatId: string, text: string): Promise<ChatMessage> {
  const record = await sendConversationMessage(Number(chatId), text);
  return mapMessageRecord(record);
}

export async function markChatReadOnServer(chatId: string): Promise<void> {
  await markConversationRead(Number(chatId));
}
