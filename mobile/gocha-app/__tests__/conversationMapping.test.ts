import { mapConversationRecord, mergeConversationLists } from '../src/chat/conversationApi';
import { createOrderAssistantChat } from '../src/chat/seedData';
import type { ConversationRecord } from '../src/api/client';
import type { ChatRecord } from '../src/chat/types';

const baseRecord: ConversationRecord = {
  id: 9,
  type: 'dm',
  name: 'Bob',
  avatarUrl: null,
  avatarLabel: 'B',
  avatarColor: '#1B00D8',
  otherUserId: 4,
  preview: 'Hi',
  lastActivityAt: '2026-09-01T12:00:00.000Z',
  unreadCount: 0,
  isBusiness: false,
};

describe('mapConversationRecord', () => {
  it('marks group conversations as groups with member count', () => {
    const mapped = mapConversationRecord({
      ...baseRecord,
      type: 'group',
      name: 'Family',
      otherUserId: null,
      isGroup: true,
      groupCount: 3,
    });

    expect(mapped.isGroup).toBe(true);
    expect(mapped.groupCount).toBe(3);
    expect(mapped.name).toBe('Family');
    expect(mapped.otherUserId).toBeUndefined();
  });

  it('keeps direct chats as one-to-one', () => {
    const mapped = mapConversationRecord(baseRecord);

    expect(mapped.isGroup).toBe(false);
    expect(mapped.otherUserId).toBe(4);
  });
});

function chatStub(id: string, extra: Partial<ChatRecord> = {}): ChatRecord {
  return {
    id,
    name: extra.name ?? id,
    avatarLabel: 'G',
    avatarColor: '#1B00D8',
    preview: 'No messages yet',
    dateLabel: '',
    lastActivityAt: extra.lastActivityAt ?? Date.now(),
    unreadCount: 0,
    pinned: false,
    archived: false,
    muted: false,
    blocked: false,
    locked: false,
    hidden: false,
    favorite: false,
    markedUnread: false,
    isGroup: extra.isGroup ?? false,
    isBusiness: false,
    isSecret: false,
    listIds: [],
    labelIds: [],
    ...extra,
  };
}

describe('mergeConversationLists', () => {
  const assistant = createOrderAssistantChat();

  it('keeps a group created after the fetch started', () => {
    const incoming = chatStub('12', { name: 'Existing' });
    const created = chatStub('44', { name: 'New group', isGroup: true });
    const merged = mergeConversationLists(
      assistant,
      [incoming],
      [assistant, incoming, created],
      new Set([assistant.id, incoming.id]),
    );

    expect(merged.map((chat) => chat.id)).toEqual([assistant.id, '12', '44']);
    expect(merged.find((chat) => chat.id === '44')?.isGroup).toBe(true);
  });

  it('keeps a just-created group even if it was already in the snapshot', () => {
    const created = chatStub('44', {
      name: 'New group',
      isGroup: true,
      lastActivityAt: Date.now() - 1000,
    });
    const merged = mergeConversationLists(
      assistant,
      [],
      [assistant, created],
      new Set([assistant.id, created.id]),
    );

    expect(merged.map((chat) => chat.id)).toEqual([assistant.id, '44']);
  });
});
