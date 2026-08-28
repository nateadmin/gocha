import {
  listPreviewForMessage,
  mapMessageRecord,
  previewFromMessages,
  resolveIsOutgoing,
} from '../src/chat/messageMapping';
import type { ConversationMessageRecord } from '../src/api/client';

describe('messageMapping', () => {
  const baseRecord: ConversationMessageRecord = {
    id: '42',
    type: 'text',
    text: 'Hello',
    sentAt: '2026-08-28T12:00:00.000Z',
    senderUserId: 7,
    isOutgoing: false,
    status: 'sent',
  };

  it('resolves outgoing from senderUserId when viewer is known', () => {
    expect(resolveIsOutgoing(baseRecord, 7)).toBe(true);
    expect(resolveIsOutgoing(baseRecord, 9)).toBe(false);
  });

  it('falls back to isOutgoing when viewer is unknown', () => {
    expect(resolveIsOutgoing({ ...baseRecord, isOutgoing: true })).toBe(true);
    expect(resolveIsOutgoing({ ...baseRecord, isOutgoing: false })).toBe(false);
  });

  it('maps records with viewer-aware alignment', () => {
    const incoming = mapMessageRecord(baseRecord, 9);
    const outgoing = mapMessageRecord(baseRecord, 7);

    expect(incoming.isOutgoing).toBe(false);
    expect(outgoing.isOutgoing).toBe(true);
  });

  it('builds list previews with You prefix for outgoing messages', () => {
    const incoming = mapMessageRecord(baseRecord, 9);
    const outgoing = mapMessageRecord(baseRecord, 7);

    expect(listPreviewForMessage(incoming)).toBe('Hello');
    expect(listPreviewForMessage(outgoing)).toBe('You: Hello');
    expect(previewFromMessages([incoming, outgoing])).toBe('You: Hello');
  });
});
