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

export function mapMessageRecord(
  record: ConversationMessageRecord,
  viewerUserId?: number | null,
): ChatMessage {
  return {
    id: record.id,
    type: record.type === 'emoji' ? 'emoji' : 'text',
    text: record.text ?? undefined,
    sentAt: formatTimeLabel(record.sentAt),
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

export function previewFromMessages(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last) {
    return 'No messages yet';
  }
  return listPreviewForMessage(last);
}
