import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Native has no localStorage, so the signed-in accounts used to live only in
 * memory and every app restart signed the user out.
 */
const account = {
  userId: 7,
  label: 'ada@example.com',
  displayName: 'Ada',
  avatarUrl: null,
  deviceToken: 'device-token-7',
  primaryLoginChannel: 'email',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

// Each isolated require is a fresh app launch sharing the same "disk".
function launch(): typeof import('../src/accounts/accountStore') {
  jest.doMock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: AsyncStorage,
  }));
  return require('../src/accounts/accountStore');
}

test('jest runs like a phone: no localStorage', () => {
  expect(typeof (globalThis as { localStorage?: unknown }).localStorage).toBe('undefined');
});

test('signing in writes the session to disk', async () => {
  await jest.isolateModulesAsync(async () => {
    const store = launch();
    await store.hydrateStoredAccounts();
    store.writeStoredAccounts([account]);
    store.writeActiveAccountId(7);
  });
  await new Promise((resolve) => setImmediate(resolve));

  expect(JSON.parse((await AsyncStorage.getItem('gocha.accounts.v1')) ?? '[]')).toEqual([account]);
  expect(await AsyncStorage.getItem('gocha.accounts.active.v1')).toBe('7');
});

test('a fresh launch reads the saved session back', async () => {
  await AsyncStorage.setItem('gocha.accounts.v1', JSON.stringify([account]));
  await AsyncStorage.setItem('gocha.accounts.active.v1', '7');

  await jest.isolateModulesAsync(async () => {
    const store = launch();
    expect(store.isStoredAccountsHydrated()).toBe(false);
    expect(store.readStoredAccounts()).toEqual([]);

    await store.hydrateStoredAccounts();

    expect(store.isStoredAccountsHydrated()).toBe(true);
    expect(store.readStoredAccounts()).toEqual([account]);
    expect(store.readActiveAccountId()).toBe(7);
  });
});

test('quick successive writes reach disk in order even if storage finishes them out of order', async () => {
  const disk = new Map<string, string>();
  let call = 0;
  // The first write is slowest, like parallel IO coroutines on Android.
  const slowFirst = (apply: () => void) =>
    new Promise<void>((resolve) => {
      const delay = call++ === 0 ? 30 : 0;
      setTimeout(() => {
        apply();
        resolve();
      }, delay);
    });
  const fakeStorage = {
    getMany: async (keys: string[]) => Object.fromEntries(keys.map((key) => [key, disk.get(key) ?? null])),
    setItem: (key: string, value: string) => slowFirst(() => disk.set(key, value)),
    removeItem: (key: string) => slowFirst(() => disk.delete(key)),
  };

  await jest.isolateModulesAsync(async () => {
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      __esModule: true,
      default: fakeStorage,
    }));
    const store = require('../src/accounts/accountStore');
    await store.hydrateStoredAccounts();
    store.writeActiveAccountId(7);
    store.writeActiveAccountId(null);
    store.writeActiveAccountId(9);
  });
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(disk.get('gocha.accounts.active.v1')).toBe('9');
});

test('signing out removes the session from disk', async () => {
  await AsyncStorage.setItem('gocha.accounts.v1', JSON.stringify([account]));
  await AsyncStorage.setItem('gocha.accounts.active.v1', '7');

  await jest.isolateModulesAsync(async () => {
    const store = launch();
    await store.hydrateStoredAccounts();
    store.clearAllStoredAccounts();
  });
  await new Promise((resolve) => setImmediate(resolve));

  expect(await AsyncStorage.getItem('gocha.accounts.v1')).toBeNull();
  expect(await AsyncStorage.getItem('gocha.accounts.active.v1')).toBeNull();
});
