import {
  readStoredChatDrafts,
  removeStoredChatDraft,
  upsertStoredChatDraft,
} from '../src/chat/chatDraftsStore';

describe('chatDraftsStore', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
      configurable: true,
    });
    store.clear();
  });

  test('stores and reads a draft for a chat', () => {
    upsertStoredChatDraft('42', 'Hello there');
    expect(readStoredChatDrafts()['42']?.text).toBe('Hello there');
  });

  test('removes a draft when text is blank', () => {
    upsertStoredChatDraft('42', 'Hello there');
    upsertStoredChatDraft('42', '   ');
    expect(readStoredChatDrafts()['42']).toBeUndefined();
  });

  test('removeStoredChatDraft clears one chat draft', () => {
    upsertStoredChatDraft('42', 'Hello there');
    removeStoredChatDraft('42');
    expect(readStoredChatDrafts()['42']).toBeUndefined();
  });
});
