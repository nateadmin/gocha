import type { ConversationMessageRecord } from '../api/client';
import type { ChatMessage } from './types';

function formatTimeLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function resolveIsOutgoing(
  record: ConversationMessageRecord,
  viewerUserId?: number | null,
): boolean {
  if (viewerUserId != null && record.senderUserId != null) {
    return record.senderUserId === viewerUserId;
  }

  if (typeof record.isOutgoing === 'boolean') {
    return record.isOutgoing;
  }

  if (typeof record.isOutgoing === 'string') {
    return record.isOutgoing === 'true' || record.isOutgoing === '1';
  }

  return false;
}

function parseSentAtMs(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export function mapMessageRecord(
  record: ConversationMessageRecord,
  viewerUserId?: number | null,
): ChatMessage {
  return {
    id: record.id,
    type: record.type === 'emoji' ? 'emoji' : 'text',
    text: record.text ?? undefined,
    sentAt: formatTimeLabel(record.sentAt),
    sentAtMs: parseSentAtMs(record.sentAt),
    isOutgoing: resolveIsOutgoing(record, viewerUserId),
    status: record.status ?? 'sent',
  };
}

export function previewForMessage(message: ChatMessage): string {
  switch (message.type) {
    case 'voice':
      return `Voice message (${message.durationSec ?? 0}s)`;
    case 'video':
      return 'Video';
    case 'image':
      return 'Photo';
    case 'file':
      return message.fileName ?? 'File';
    case 'sticker':
      return message.stickerKey ?? 'Sticker';
    case 'emoji':
      return message.text ?? '';
    default:
      return message.text ?? '';
  }
}

export function listPreviewForMessage(message: ChatMessage): string {
  const body = previewForMessage(message);
  return message.isOutgoing ? `You: ${body}` : body;
}

/**
 * Merges server records with local state so a refresh never destroys
 * optimistic sends, device-local media messages, local deletions, or local
 * flags such as starred/reply metadata.
 */
export function mergeMessages(
  previous: ChatMessage[],
  server: ChatMessage[],
  deletedIds: ReadonlySet<string>,
): ChatMessage[] {
  const previousById = new Map(previous.map((message) => [message.id, message]));
  const serverIds = new Set(server.map((record) => record.id));

  const merged = server
    .filter((record) => !deletedIds.has(record.id))
    .map((record) => {
      const prior = previousById.get(record.id);
      if (!prior) return record;
      return {
        ...record,
        ...(prior.starred ? { starred: true } : {}),
        ...(prior.replyToId ? { replyToId: prior.replyToId } : {}),
      };
    });

  const localOnly = previous.filter((message) => !serverIds.has(message.id));
  return localOnly.length > 0 ? [...merged, ...localOnly] : merged;
}

/**
 * Compares two message lists by identity AND viewer-relative content. Ids
 * alone are not enough: after an account switch the same ids come back with
 * flipped isOutgoing, and that change must not be discarded as a no-op.
 */
export function sameMessageList(previous: ChatMessage[], next: ChatMessage[]): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((message, index) => {
    const other = next[index];
    return (
      other !== undefined &&
      message.id === other.id &&
      message.isOutgoing === other.isOutgoing &&
      message.text === other.text &&
      message.status === other.status
    );
  });
}

export function previewFromMessages(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last) {
    return 'No messages yet';
  }
  return listPreviewForMessage(last);
}
