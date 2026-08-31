import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  completeOnboarding,
  fetchCurrentUser,
  getActiveDeviceToken,
  issueDeviceToken,
  logout as apiLogout,
  requestOtp,
  updateLanguage as apiUpdateLanguage,
  updateProfile as apiUpdateProfile,
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
  verifyWithOtp: (
    identifier: string,
    code: string,
    mode: OtpAuthMode,
    options?: {
      channel?: 'email' | 'phone';
      firebaseIdToken?: string;
      language?: string;
      country?: string | null;
    },
  ) => Promise<void>;
  requestAuthCode: (
    identifier: string,
    mode: OtpAuthMode,
    options?: { channel?: 'email' | 'phone' },
  ) => Promise<{ resendAvailableInSeconds: number }>;
  finishOnboarding: (input: {
    displayName: string;
    username?: string;
    status?: string;
    bio?: string;
    phone?: string;
    discoverable: boolean;
  }) => Promise<void>;
  updateProfile: (input: {
    displayName: string;
    status?: string;
    bio?: string;
    phone?: string;
    discoverable: boolean;
  }) => Promise<void>;
  uploadProfileAvatar: (file: Blob, filename?: string) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  signOut: () => Promise<'auth' | 'switched'>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isAuthFailure(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 401 ||
      error.status === 419 ||
      error.body.code === 'UNAUTHENTICATED' ||
      error.body.code === 'CSRF_MISMATCH')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    accounts,
    activeAccountId,
    adoptActiveAccount,
    removeAccount,
    patchAccountDeviceToken,
    registerAccount,
    switchAccount,
    syncAccountProfile,
  } = useAccounts();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasBootstrapped = useRef(false);
  const userRef = useRef<AuthUser | null>(null);
  const activeAccountIdRef = useRef(activeAccountId);
  const adoptActiveAccountRef = useRef(adoptActiveAccount);
  const removeAccountRef = useRef(removeAccount);
  const syncAccountProfileRef = useRef(syncAccountProfile);

  userRef.current = user;
  activeAccountIdRef.current = activeAccountId;
  adoptActiveAccountRef.current = adoptActiveAccount;
  removeAccountRef.current = removeAccount;
  syncAccountProfileRef.current = syncAccountProfile;

  const syncUserToStoredAccount = useCallback((nextUser: AuthUser) => {
    syncAccountProfileRef.current(nextUser.id, {
      displayName: nextUser.displayName,
      avatarUrl: nextUser.avatarUrl,
      label: nextUser.email ?? nextUser.phone ?? 'This device',
    });
  }, []);

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    if (!background) {
      setLoading(true);
    }

    try {
      const hadToken = getActiveDeviceToken();
      const nextUser = await fetchCurrentUser();

      if (nextUser) {
        setUser(nextUser);
        setError(null);
        syncUserToStoredAccount(nextUser);

        // The session decides who is authenticated on web. If the locally
        // stored active account claims a different user, adopt the session
        // identity so the UI never claims to be one user while requests run
        // as another.
        if (activeAccountIdRef.current !== null && activeAccountIdRef.current !== nextUser.id) {
          adoptActiveAccountRef.current(nextUser.id);
        }

        if (!getActiveDeviceToken()) {
          try {
            const tokenPayload = await issueDeviceToken();
            patchAccountDeviceToken(nextUser.id, tokenPayload.deviceToken);
          } catch {
            // Session cookie auth may still work for stateful API requests.
          }
        }
        return;
      }

      // Confirmed unauthenticated session.
      setUser(null);
      if (hadToken && activeAccountIdRef.current !== null) {
        removeAccountRef.current(activeAccountIdRef.current);
      }
      setError(null);
    } catch (err) {
      if (isAuthFailure(err)) {
        setUser(null);
        if (activeAccountIdRef.current !== null) {
          removeAccountRef.current(activeAccountIdRef.current);
        }
        setError(null);
      } else {
        // Transient failures (429, 5xx, network) must not sign the user out.
        if (userRef.current) {
          setUser(userRef.current);
        }
        setError(err instanceof ApiError ? err.message : 'Could not refresh your session.');
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [patchAccountDeviceToken, syncUserToStoredAccount]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true;
      void refreshRef.current({ background: false });
      return;
    }

    void refreshRef.current({ background: true });
  }, [activeAccountId]);

  const clearError = useCallback(() => setError(null), []);

  const requestAuthCode = useCallback(
    async (
      identifier: string,
      mode: OtpAuthMode,
      options?: { channel?: 'email' | 'phone' },
    ) => {
      const payload = await requestOtp(identifier, mode, options);
      return { resendAvailableInSeconds: payload.resendAvailableInSeconds };
    },
    [],
  );

  const verifyWithOtp = useCallback(
    async (
      identifier: string,
      code: string,
      mode: OtpAuthMode,
      options?: {
        channel?: 'email' | 'phone';
        firebaseIdToken?: string;
        language?: string;
        country?: string | null;
      },
    ) => {
      const payload = await verifyOtp(identifier, code, mode, options);
      if (mode === 'link') {
        setUser(payload.user);
        setError(null);
        syncUserToStoredAccount(payload.user);
        return;
      }
      if (!payload.account || !payload.deviceToken) {
        throw new Error('Could not finish sign-in.');
      }
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
      syncUserToStoredAccount(payload.user);
    },
    [registerAccount, syncUserToStoredAccount],
  );

  const finishOnboarding = useCallback(
    async (input: {
      displayName: string;
      username?: string;
      status?: string;
      bio?: string;
      phone?: string;
      discoverable: boolean;
    }) => {
      const nextUser = await completeOnboarding(input);
      setUser(nextUser);
      syncUserToStoredAccount(nextUser);
    },
    [syncUserToStoredAccount],
  );

  const updateProfile = useCallback(
    async (input: {
      displayName: string;
      status?: string;
      bio?: string;
      phone?: string;
      discoverable: boolean;
    }) => {
      const nextUser = await apiUpdateProfile(input);
      setUser(nextUser);
      syncUserToStoredAccount(nextUser);
    },
    [syncUserToStoredAccount],
  );

  const updateLanguage = useCallback(async (language: string) => {
    const nextUser = await apiUpdateLanguage(language);
    setUser(nextUser);
    syncUserToStoredAccount(nextUser);
  }, [syncUserToStoredAccount]);

  const uploadProfileAvatar = useCallback(async (file: Blob, filename?: string) => {
    const nextUser = await uploadAvatar(file, filename);
    setUser(nextUser);
    syncUserToStoredAccount(nextUser);
  }, [syncUserToStoredAccount]);

  const signOut = useCallback(async (): Promise<'auth' | 'switched'> => {
    if (!user) {
      return 'auth';
    }

    const signingOutUserId = user.id;
    const remaining = accounts.filter((entry) => entry.userId !== signingOutUserId);
    const hasOtherAccounts = remaining.length > 0;

    try {
      await apiLogout({ deviceOnly: hasOtherAccounts });
    } catch {
      // Continue removing the local account even if token revocation fails.
    }

    removeAccount(signingOutUserId);

    if (hasOtherAccounts) {
      // The session still belongs to the signed-out user; switch it to the
      // next account before refreshing, or the wrong identity lingers.
      const switched = await switchAccount(remaining[0].userId);
      if (!switched) {
        setUser(null);
        return 'auth';
      }
      await refresh({ background: false });
      return 'switched';
    }

    setUser(null);
    return 'auth';
  }, [accounts, removeAccount, refresh, switchAccount, user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      clearError,
      refresh: () => refresh({ background: false }),
      verifyWithOtp,
      requestAuthCode,
      finishOnboarding,
      updateProfile,
      uploadProfileAvatar,
      updateLanguage,
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
      updateProfile,
      uploadProfileAvatar,
      updateLanguage,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
  appPhase: 'auth' | 'onboarding' | 'main';
} {
  const { user, loading } = useAuth();

  const appPhase = !user
    ? 'auth'
    : user.needsOnboarding
      ? 'onboarding'
      : 'main';

  return {
    user,
    loading,
    appPhase,
  };
}
