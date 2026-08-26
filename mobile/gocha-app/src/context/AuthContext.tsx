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
  ApiError,
  completeOnboarding,
  fetchCurrentUser,
  logout as apiLogout,
  requestOtp,
  uploadAvatar,
  verifyOtp,
  type AuthUser,
  type OtpAuthMode,
} from '../api/client';
import { useAccounts } from './AccountsContext';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  verifyWithOtp: (email: string, code: string, mode: OtpAuthMode) => Promise<void>;
  requestAuthCode: (
    email: string,
    mode: OtpAuthMode,
  ) => Promise<{ resendAvailableInSeconds: number }>;
  finishOnboarding: (input: {
    displayName: string;
    status?: string;
    bio?: string;
    phone?: string;
    discoverable: boolean;
  }) => Promise<void>;
  uploadProfileAvatar: (file: Blob, filename?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    accounts,
    activeAccountId,
    isAddingAccount,
    registerAccount,
    removeAccount,
    switchAccount,
  } = useAccounts();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      setError(null);
      if (!nextUser && activeAccountId !== null) {
        removeAccount(activeAccountId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your session.');
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, removeAccount]);

  useEffect(() => {
    refresh();
  }, [refresh, activeAccountId]);

  const clearError = useCallback(() => setError(null), []);

  const requestAuthCode = useCallback(async (email: string, mode: OtpAuthMode) => {
    const payload = await requestOtp(email, mode);
    return { resendAvailableInSeconds: payload.resendAvailableInSeconds };
  }, []);

  const verifyWithOtp = useCallback(
    async (email: string, code: string, mode: OtpAuthMode) => {
      const payload = await verifyOtp(email, code, mode);
      registerAccount({
        userId: payload.account.id,
        label: payload.account.label,
        displayName: payload.account.displayName,
        avatarUrl: payload.account.avatarUrl,
        deviceToken: payload.deviceToken,
        primaryLoginChannel: payload.account.primaryLoginChannel,
      });
      setUser(payload.user);
      setError(null);
    },
    [registerAccount],
  );

  const finishOnboarding = useCallback(
    async (input: {
      displayName: string;
      status?: string;
      bio?: string;
      phone?: string;
      discoverable: boolean;
    }) => {
      const nextUser = await completeOnboarding(input);
      setUser(nextUser);
    },
    [],
  );

  const uploadProfileAvatar = useCallback(async (file: Blob, filename?: string) => {
    const nextUser = await uploadAvatar(file, filename);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Removing local account even if remote logout fails.
    }
    if (user) {
      removeAccount(user.id);
    }
    setUser(null);
  }, [removeAccount, user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      clearError,
      refresh,
      verifyWithOtp,
      requestAuthCode,
      finishOnboarding,
      uploadProfileAvatar,
      signOut,
    }),
    [
      user,
      loading,
      error,
      clearError,
      refresh,
      verifyWithOtp,
      requestAuthCode,
      finishOnboarding,
      uploadProfileAvatar,
      signOut,
    ],
  );

  const shouldShowAuth = !user && (accounts.length === 0 || isAddingAccount);

  return (
    <AuthContext.Provider value={value}>
      {shouldShowAuth ? children : children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthGate(): {
  user: AuthUser | null;
  loading: boolean;
  showAuthFlow: boolean;
} {
  const { user, loading } = useAuth();
  const { isAddingAccount } = useAccounts();

  return {
    user,
    loading,
    showAuthFlow: isAddingAccount || !user,
  };
}
