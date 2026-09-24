export type StoredAccount = {
  userId: number;
  label: string;
  displayName: string;
  avatarUrl: string | null;
  deviceToken: string;
  primaryLoginChannel: string;
};

export type LinkedAccountEntry = {
  id: number;
  label: string;
  displayName: string;
  avatarUrl: string | null;
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

export function clearAllStoredAccounts(): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_KEY);
}

export function updateStoredAccountProfile(
  userId: number,
  profile: Pick<StoredAccount, 'displayName' | 'avatarUrl' | 'label'>,
): StoredAccount[] {
  const current = readStoredAccounts();
  const index = current.findIndex((account) => account.userId === userId);
  if (index === -1) {
    return current;
  }

  const existing = current[index];
  if (
    existing.displayName === profile.displayName &&
    existing.avatarUrl === profile.avatarUrl &&
    existing.label === profile.label
  ) {
    return current;
  }

  const accounts = current.map((account) =>
    account.userId === userId ? { ...account, ...profile } : account,
  );
  writeStoredAccounts(accounts);
  return accounts;
}

export function mergeLinkedAccounts(
  prev: StoredAccount[],
  linked: LinkedAccountEntry[],
  current?: StoredAccount | null,
): StoredAccount[] {
  const byId = new Map(prev.map((entry) => [entry.userId, entry]));
  if (current) {
    const existing = byId.get(current.userId);
    byId.set(current.userId, existing ? { ...existing, ...current } : current);
  }
  for (const item of linked) {
    byId.set(item.id, toStoredFromSwitcher(item, byId.get(item.id)));
  }
  return Array.from(byId.values());
}

function toStoredFromSwitcher(
  entry: LinkedAccountEntry,
  existing?: StoredAccount,
): StoredAccount {
  return {
    userId: entry.id,
    label: entry.label,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    deviceToken: existing?.deviceToken ?? '',
    primaryLoginChannel: entry.primaryLoginChannel,
  };
}

export function updateStoredAccountDeviceToken(userId: number, deviceToken: string): StoredAccount[] {
  const accounts = readStoredAccounts().map((account) =>
    account.userId === userId ? { ...account, deviceToken } : account,
  );
  writeStoredAccounts(accounts);
  return accounts;
}
