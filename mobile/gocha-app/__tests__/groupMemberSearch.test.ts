import type { ChatRecord } from '../src/chat/types';
import { searchLocalContacts } from '../src/chat/globalSearchLocal';
import {
  mergeGroupMemberResults,
  profileFromLocalChat,
  profileFromSearchContact,
} from '../src/groups/groupMemberSearch';

function chat(overrides: Partial<ChatRecord>): ChatRecord {
  return {
    id: '1',
    name: 'Bob Contact',
    avatarLabel: 'B',
    avatarColor: '#1B00D8',
    preview: 'Hi',
    dateLabel: 'now',
    lastActivityAt: 1,
    unreadCount: 0,
    pinned: false,
    archived: false,
    muted: false,
    blocked: false,
    locked: false,
    hidden: false,
    favorite: false,
    markedUnread: false,
    isGroup: false,
    isBusiness: false,
    isSecret: false,
    listIds: [],
    labelIds: [],
    otherUserId: 8,
    ...overrides,
  };
}

describe('groupMemberSearch', () => {
  it('maps a DM chat to a selectable profile', () => {
    const profile = profileFromLocalChat(chat({ otherUserId: 8, name: 'Bob Contact' }));
    expect(profile?.id).toBe(8);
    expect(profile?.displayName).toBe('Bob Contact');
    expect(profileFromLocalChat(chat({ isGroup: true, otherUserId: 8 }))).toBeNull();
    expect(profileFromLocalChat(chat({ otherUserId: undefined }))).toBeNull();
  });

  it('maps a remote chat contact', () => {
    const profile = profileFromSearchContact({
      conversationId: 3,
      userId: 9,
      displayName: 'Carol',
      username: 'carol',
      avatarUrl: null,
    });
    expect(profile.id).toBe(9);
    expect(profile.username).toBe('carol');
  });

  it('finds chat contacts by partial name and merges remote matches without duplicates', () => {
    const localChats = [
      chat({ id: '11', name: 'Bob Contact', otherUserId: 8 }),
      chat({ id: '12', name: 'Dana Group', isGroup: true, otherUserId: 4 }),
    ];
    const local = searchLocalContacts(localChats, 'bo', new Set()).flatMap((row) => {
      const profile = profileFromLocalChat(row);
      return profile ? [profile] : [];
    });
    expect(local.map((row) => row.id)).toEqual([8]);

    const merged = mergeGroupMemberResults({
      local,
      contacts: [
        profileFromSearchContact({
          conversationId: 11,
          userId: 8,
          displayName: 'Bob Contact',
          username: 'bob.contact',
          avatarUrl: null,
        }),
        profileFromSearchContact({
          conversationId: 14,
          userId: 14,
          displayName: 'Bobby',
          username: null,
          avatarUrl: null,
        }),
      ],
      people: [
        {
          id: 8,
          username: 'bob.contact',
          displayName: 'Bob Contact',
          status: null,
          bio: null,
          avatarUrl: null,
          verificationStatus: 'none',
          profileMode: 'personal',
          website: null,
          chatUserId: 8,
        },
      ],
      excludeIds: [1],
    });

    expect(merged.map((row) => row.id)).toEqual([8, 14]);
    expect(merged[0]?.username).toBe('bob.contact');
  });
});
