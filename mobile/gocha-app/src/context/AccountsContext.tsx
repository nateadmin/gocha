import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  readActiveAccountId,
  readStoredAccounts,
  updateStoredAccountDeviceToken,
  updateStoredAccountProfile,
  writeActiveAccountId,
  writeStoredAccounts,
  type StoredAccount,
} from '../accounts/accountStore';
import {
  ApiError,
  fetchLinkedAccounts,
  linkAccount as apiLinkAccount,
  setActiveDeviceToken,
  switchSession,
  unlinkAccount as apiUnlinkAccount,
  type AccountSwitcherEntry,
} from '../api/client';

type AccountsContextValue = {
  accounts: StoredAccount[];
  activeAccountId: number | null;
  isAddingAccount: boolean;
  beginAddAccount: () => void;
  cancelAddAccount: () => void;
  registerAccount: (account: StoredAccount) => void;
  switchAccount: (userId: number) => Promise<boolean>;
  adoptActiveAccount: (userId: number) => void;
  removeAccount: (userId: number) => void;
  unlinkAccount: (userId: number) => Promise<void>;
  persistAccountLink: (counterpartDeviceToken: string) => Promise<void>;
  hydrateLinkedAccounts: (current?: StoredAccount | null) => Promise<void>;
  patchAccountDeviceToken: (userId: number, deviceToken: string) => void;
  syncAccountProfile: (
    userId: number,
    profile: Pick<StoredAccount, 'displayName' | 'avatarUrl' | 'label'>,
  ) => void;
};

const AccountsContext = createContext<AccountsContextValue | null>(null);

function toStoredAccount(
  entry: AccountSwitcherEntry,
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

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => readStoredAccounts());
  const [activeAccountId, setActiveAccountId] = useState<number | null>(() => {
    const storedAccounts = readStoredAccounts();
    const id = readActiveAccountId();
    if (id === null) {
      setActiveDeviceToken(null);
      return null;
    }
    const match = storedAccounts.find((entry) => entry.userId === id);
    setActiveDeviceToken(match?.deviceToken || null);
    return id;
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const applyActiveToken = useCallback((userId: number | null, list: StoredAccount[]) => {
    if (userId === null) {
      setActiveDeviceToken(null);
      return;
    }
    const match = list.find((entry) => entry.userId === userId);
    setActiveDeviceToken(match?.deviceToken || null);
  }, []);

  useEffect(() => {
    applyActiveToken(activeAccountId, accounts);
  }, [activeAccountId, accounts, applyActiveToken]);

  const replaceAccounts = useCallback((next: StoredAccount[]) => {
    writeStoredAccounts(next);
    setAccounts(next);
    return next;
  }, []);

  const registerAccount = useCallback((account: StoredAccount) => {
    setAccounts((prev) => {
      const without = prev.filter((entry) => entry.userId !== account.userId);
      const next = [...without, account];
      writeStoredAccounts(next);
      return next;
    });
    setActiveAccountId(account.userId);
    writeActiveAccountId(account.userId);
    setIsAddingAccount(false);
    setActiveDeviceToken(account.deviceToken || null);
  }, []);

  const hydrateLinkedAccounts = useCallback(
    async (current?: StoredAccount | null) => {
      try {
        const linked = await fetchLinkedAccounts();
        setAccounts((prev) => {
          const byId = new Map(prev.map((entry) => [entry.userId, entry]));
          if (current) {
            byId.set(current.userId, { ...byId.get(current.userId), ...current });
          }
          const activeId = current?.userId ?? activeAccountId;
          const next: StoredAccount[] = [];
          const seen = new Set<number>();
          const push = (entry: StoredAccount) => {
            if (seen.has(entry.userId)) {
              return;
            }
            seen.add(entry.userId);
            next.push(entry);
          };
          if (activeId != null && byId.has(activeId)) {
            push(byId.get(activeId)!);
          }
          for (const item of linked) {
            push(toStoredAccount(item, byId.get(item.id)));
          }
          writeStoredAccounts(next);
          return next;
        });
      } catch {
        // Keep the locally stored accounts if the network call fails.
      }
    },
    [activeAccountId],
  );

  const persistAccountLink = useCallback(
    async (counterpartDeviceToken: string) => {
      const linked = await apiLinkAccount(counterpartDeviceToken);
      setAccounts((prev) => {
        const byId = new Map(prev.map((entry) => [entry.userId, entry]));
        const next = prev.slice();
        for (const item of linked) {
          if (byId.has(item.id)) {
            continue;
          }
          const stored = toStoredAccount(item);
          next.push(stored);
          byId.set(item.id, stored);
        }
        writeStoredAccounts(next);
        return next;
      });
    },
    [],
  );

  const removeAccount = useCallback(
    (userId: number) => {
      const remaining = accounts.filter((entry) => entry.userId !== userId);
      replaceAccounts(remaining);

      if (activeAccountId === userId) {
        const nextActive = remaining[0]?.userId ?? null;
        setActiveAccountId(nextActive);
        writeActiveAccountId(nextActive);
        if (nextActive === null) {
          setActiveDeviceToken(null);
        } else {
          const match = remaining.find((entry) => entry.userId === nextActive);
          setActiveDeviceToken(match?.deviceToken || null);
        }
      }
    },
    [activeAccountId, accounts, replaceAccounts],
  );

  const unlinkAccount = useCallback(
    async (userId: number) => {
      await apiUnlinkAccount(userId);
      removeAccount(userId);
    },
    [removeAccount],
  );

  const switchAccount = useCallback(
    async (userId: number): Promise<boolean> => {
      const match = accounts.find((entry) => entry.userId === userId);
      if (!match) {
        return false;
      }

      try {
        const payload = await switchSession(
          match.deviceToken
            ? { deviceToken: match.deviceToken, userId }
            : { userId },
        );
        setAccounts(() => updateStoredAccountDeviceToken(userId, payload.deviceToken));
        setActiveAccountId(userId);
        writeActiveAccountId(userId);
        setActiveDeviceToken(payload.deviceToken);
        return true;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 422)) {
          removeAccount(userId);
        }
        return false;
      }
    },
    [accounts, removeAccount],
  );

  const adoptActiveAccount = useCallback((userId: number) => {
    setActiveAccountId((current) => {
      if (current === userId) {
        return current;
      }
      writeActiveAccountId(userId);
      return userId;
    });
  }, []);

  const patchAccountDeviceToken = useCallback((userId: number, deviceToken: string) => {
    setAccounts(() => updateStoredAccountDeviceToken(userId, deviceToken));
    if (activeAccountId === userId) {
      setActiveDeviceToken(deviceToken);
    }
  }, [activeAccountId]);

  const syncAccountProfile = useCallback(
    (userId: number, profile: Pick<StoredAccount, 'displayName' | 'avatarUrl' | 'label'>) => {
      setAccounts((prev) => {
        const existing = prev.find((entry) => entry.userId === userId);
        if (!existing) {
          return prev;
        }
        if (
          existing.displayName === profile.displayName &&
          existing.avatarUrl === profile.avatarUrl &&
          existing.label === profile.label
        ) {
          return prev;
        }
        return updateStoredAccountProfile(userId, profile);
      });
    },
    [],
  );

  const beginAddAccount = useCallback(() => setIsAddingAccount(true), []);
  const cancelAddAccount = useCallback(() => setIsAddingAccount(false), []);

  const value = useMemo(
    () => ({
      accounts,
      activeAccountId,
      isAddingAccount,
      beginAddAccount,
      cancelAddAccount,
      registerAccount,
      switchAccount,
      adoptActiveAccount,
      removeAccount,
      unlinkAccount,
      persistAccountLink,
      hydrateLinkedAccounts,
      patchAccountDeviceToken,
      syncAccountProfile,
    }),
    [
      accounts,
      activeAccountId,
      isAddingAccount,
      beginAddAccount,
      cancelAddAccount,
      registerAccount,
      switchAccount,
      adoptActiveAccount,
      removeAccount,
      unlinkAccount,
      persistAccountLink,
      hydrateLinkedAccounts,
      patchAccountDeviceToken,
      syncAccountProfile,
    ],
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountsProvider');
  }
  return context;
}
