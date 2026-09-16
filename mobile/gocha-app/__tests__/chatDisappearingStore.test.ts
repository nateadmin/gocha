import {
  readStoredDisappearingOverrides,
  setStoredDisappearingOverride,
  withDisappearingOverrides,
  writeStoredDisappearingOverrides,
} from '../src/chat/chatDisappearingStore';

describe('chatDisappearingStore', () => {
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

  test('stores and reads per-chat overrides', () => {
    writeStoredDisappearingOverrides({ '42': 300, '7': null });
    expect(readStoredDisappearingOverrides()).toEqual({ '42': 300, '7': null });
  });

  test('clears an override when inherit is selected', () => {
    const next = setStoredDisappearingOverride({ '42': 300 }, '42', 'inherit');
    expect(next).toEqual({});
  });

  test('merges overrides onto chat records', () => {
    const chats = withDisappearingOverrides(
      [{ id: '42', name: 'Ada' }, { id: '7', name: 'Ben' }],
      { '42': 60 },
    );

    expect(chats[0].disappearingOverride).toBe(60);
    expect(chats[1].disappearingOverride).toBeUndefined();
  });
});
