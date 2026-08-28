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
import { ApiError, setActiveDeviceToken, switchSession } from '../api/client';

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
  patchAccountDeviceToken: (userId: number, deviceToken: string) => void;
  syncAccountProfile: (
    userId: number,
    profile: Pick<StoredAccount, 'displayName' | 'avatarUrl' | 'label'>,
  ) => void;
};

const AccountsContext = createContext<AccountsContextValue | null>(null);

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
    setActiveDeviceToken(match?.deviceToken ?? null);
    return id;
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const applyActiveToken = useCallback((userId: number | null, list: StoredAccount[]) => {
    if (userId === null) {
      setActiveDeviceToken(null);
      return;
    }
    const match = list.find((entry) => entry.userId === userId);
    setActiveDeviceToken(match?.deviceToken ?? null);
  }, []);

  useEffect(() => {
    applyActiveToken(activeAccountId, accounts);
  }, [activeAccountId, accounts, applyActiveToken]);

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
    setActiveDeviceToken(account.deviceToken);
  }, []);

  const removeAccount = useCallback(
    (userId: number) => {
      const remaining = accounts.filter((entry) => entry.userId !== userId);
      setAccounts(() => {
        writeStoredAccounts(remaining);
        return remaining;
      });

      if (activeAccountId === userId) {
        const nextActive = remaining[0]?.userId ?? null;
        setActiveAccountId(nextActive);
        writeActiveAccountId(nextActive);
        if (nextActive === null) {
          setActiveDeviceToken(null);
        } else {
          const match = remaining.find((entry) => entry.userId === nextActive);
          setActiveDeviceToken(match?.deviceToken ?? null);
        }
      }
    },
    [activeAccountId, accounts],
  );

  /**
   * Switches the server session to the target account before changing any
   * client state. On stateful (web) requests the session cookie decides the
   * authenticated user, so swapping only the bearer token is not enough.
   */
  const switchAccount = useCallback(
    async (userId: number): Promise<boolean> => {
      const match = accounts.find((entry) => entry.userId === userId);
      if (!match) {
        return false;
      }

      try {
        const payload = await switchSession(match.deviceToken);
        setAccounts(() => updateStoredAccountDeviceToken(userId, payload.deviceToken));
        setActiveAccountId(userId);
        writeActiveAccountId(userId);
        setActiveDeviceToken(payload.deviceToken);
        return true;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 422)) {
          // The stored device token is dead; this account must sign in again.
          removeAccount(userId);
        }
        return false;
      }
    },
    [accounts, removeAccount],
  );

  /**
   * Aligns the client's active account with the already-authenticated session
   * user (no server call). Used at bootstrap when the session identity and
   * the locally stored active account disagree.
   */
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
