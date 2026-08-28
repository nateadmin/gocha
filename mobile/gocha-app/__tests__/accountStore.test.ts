import {
  readStoredAccounts,
  updateStoredAccountProfile,
  writeStoredAccounts,
  type StoredAccount,
} from '../src/accounts/accountStore';

const STORAGE_KEY = 'gocha.accounts.v1';

describe('updateStoredAccountProfile', () => {
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
  });

  function seed(account: StoredAccount): void {
    writeStoredAccounts([account]);
  }

  test('does not rewrite storage when profile fields are unchanged', () => {
    const account: StoredAccount = {
      userId: 1,
      label: 'nate@example.com',
      displayName: 'Nate',
      avatarUrl: null,
      deviceToken: 'token',
      primaryLoginChannel: 'email',
    };
    seed(account);

    const storedBefore = localStorage.getItem(STORAGE_KEY);
    const after = updateStoredAccountProfile(1, {
      displayName: 'Nate',
      avatarUrl: null,
      label: 'nate@example.com',
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe(storedBefore);
    expect(after[0]?.displayName).toBe('Nate');
  });

  test('writes and returns a new array when profile fields change', () => {
    seed({
      userId: 1,
      label: 'nate@example.com',
      displayName: 'Nate',
      avatarUrl: null,
      deviceToken: 'token',
      primaryLoginChannel: 'email',
    });

    const after = updateStoredAccountProfile(1, {
      displayName: 'Nate Admin',
      avatarUrl: null,
      label: 'nate@example.com',
    });

    expect(after[0]?.displayName).toBe('Nate Admin');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')[0].displayName).toBe('Nate Admin');
  });
});
