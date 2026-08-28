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
import { setActiveDeviceToken } from '../api/client';

type AccountsContextValue = {
  accounts: StoredAccount[];
  activeAccountId: number | null;
  isAddingAccount: boolean;
  beginAddAccount: () => void;
  cancelAddAccount: () => void;
  registerAccount: (account: StoredAccount) => void;
  switchAccount: (userId: number) => void;
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

  const switchAccount = useCallback(
    (userId: number) => {
      setActiveAccountId(userId);
      writeActiveAccountId(userId);
      const match = accounts.find((entry) => entry.userId === userId);
      setActiveDeviceToken(match?.deviceToken ?? null);
    },
    [accounts],
  );

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

  const patchAccountDeviceToken = useCallback((userId: number, deviceToken: string) => {
    setAccounts((prev) => {
      const next = updateStoredAccountDeviceToken(userId, deviceToken);
      return next;
    });
    if (activeAccountId === userId) {
      setActiveDeviceToken(deviceToken);
    }
  }, [activeAccountId]);

  const syncAccountProfile = useCallback(
    (userId: number, profile: Pick<StoredAccount, 'displayName' | 'avatarUrl' | 'label'>) => {
      setAccounts((prev) => {
        if (!prev.some((entry) => entry.userId === userId)) {
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
