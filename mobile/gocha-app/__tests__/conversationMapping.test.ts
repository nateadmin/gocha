import { mapConversationRecord } from '../src/chat/conversationApi';
import type { ConversationRecord } from '../src/api/client';

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
