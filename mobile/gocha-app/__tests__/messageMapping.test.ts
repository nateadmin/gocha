import {
  listPreviewForMessage,
  mapMessageRecord,
  mergeMessages,
  previewFromMessages,
  resolveIsOutgoing,
} from '../src/chat/messageMapping';
import type { ConversationMessageRecord } from '../src/api/client';
import type { ChatMessage } from '../src/chat/types';

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

  it('parses sentAtMs from the ISO timestamp', () => {
    const mapped = mapMessageRecord(baseRecord, 7);
    expect(mapped.sentAtMs).toBe(new Date('2026-08-28T12:00:00.000Z').getTime());
  });
});

describe('mergeMessages', () => {
  const noDeleted = new Set<string>();

  function msg(id: string, overrides: Partial<ChatMessage> = {}): ChatMessage {
    return {
      id,
      type: 'text',
      text: `body-${id}`,
      sentAt: '9:00 AM',
      isOutgoing: false,
      ...overrides,
    };
  }

  it('keeps an in-flight optimistic message when the server does not know it yet', () => {
    const previous = [msg('1'), msg('pending-123', { isOutgoing: true })];
    const server = [msg('1'), msg('2')];

    const merged = mergeMessages(previous, server, noDeleted);

    expect(merged.map((m) => m.id)).toEqual(['1', '2', 'pending-123']);
  });

  it('keeps device-local media messages that never persist to the server', () => {
    const previous = [msg('1'), msg('m-55', { type: 'voice', isOutgoing: true })];
    const server = [msg('1')];

    const merged = mergeMessages(previous, server, noDeleted);

    expect(merged.map((m) => m.id)).toEqual(['1', 'm-55']);
  });

  it('does not resurrect locally deleted messages', () => {
    const previous = [msg('1')];
    const server = [msg('1'), msg('2')];

    const merged = mergeMessages(previous, server, new Set(['2']));

    expect(merged.map((m) => m.id)).toEqual(['1']);
  });

  it('preserves local starred and reply flags across refreshes', () => {
    const previous = [msg('1', { starred: true, replyToId: '9' })];
    const server = [msg('1')];

    const merged = mergeMessages(previous, server, noDeleted);

    expect(merged[0].starred).toBe(true);
    expect(merged[0].replyToId).toBe('9');
  });

  it('returns server records when local state has nothing extra', () => {
    const server = [msg('1'), msg('2')];

    expect(mergeMessages([msg('1')], server, noDeleted).map((m) => m.id)).toEqual(['1', '2']);
  });
});
