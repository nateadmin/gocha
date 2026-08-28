export type StoredAccount = {
  userId: number;
  label: string;
  displayName: string;
  avatarUrl: string | null;
  deviceToken: string;
  primaryLoginChannel: string;
};

const STORAGE_KEY = 'gocha.accounts.v1';
const ACTIVE_KEY = 'gocha.accounts.active.v1';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readStoredAccounts(): StoredAccount[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredAccounts(accounts: StoredAccount[]): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function readActiveAccountId(): number | null {
  if (!canUseStorage()) {
    return null;
  }
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (!raw) {
    return null;
  }
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function writeActiveAccountId(userId: number | null): void {
  if (!canUseStorage()) {
    return;
  }
  if (userId === null) {
    localStorage.removeItem(ACTIVE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_KEY, String(userId));
}

export function updateStoredAccountDeviceToken(userId: number, deviceToken: string): StoredAccount[] {
  const accounts = readStoredAccounts().map((account) =>
    account.userId === userId ? { ...account, deviceToken } : account,
  );
  writeStoredAccounts(accounts);
  return accounts;
}
