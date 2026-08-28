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
  verifyWithOtp: (email: string, code: string, mode: OtpAuthMode) => Promise<void>;
  requestAuthCode: (
    email: string,
    mode: OtpAuthMode,
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
  signOut: () => Promise<'auth' | 'switched'>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { accounts, activeAccountId, removeAccount, patchAccountDeviceToken, registerAccount } =
    useAccounts();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasBootstrapped = useRef(false);

  const refresh = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      if (!background) {
        setLoading(true);
      }

      try {
        const hadToken = getActiveDeviceToken();
        const nextUser = await fetchCurrentUser();
        setUser(nextUser);
        setError(null);

        if (nextUser && !getActiveDeviceToken()) {
          try {
            const tokenPayload = await issueDeviceToken();
            patchAccountDeviceToken(nextUser.id, tokenPayload.deviceToken);
          } catch {
            // Session cookie auth may still work for stateful API requests.
          }
        }

        if (!nextUser && hadToken && activeAccountId !== null) {
          removeAccount(activeAccountId);
        }
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.status === 401 ||
            err.status === 419 ||
            err.body.code === 'UNAUTHENTICATED' ||
            err.body.code === 'CSRF_MISMATCH')
        ) {
          setUser(null);
          if (activeAccountId !== null) {
            removeAccount(activeAccountId);
          }
          setError(null);
        } else {
          setUser(null);
          setError(err instanceof ApiError ? err.message : 'Could not load your session.');
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [activeAccountId, patchAccountDeviceToken, removeAccount],
  );

  useEffect(() => {
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true;
      refresh({ background: false });
      return;
    }

    refresh({ background: true });
  }, [activeAccountId, refresh]);

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
      username?: string;
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
    },
    [],
  );

  const uploadProfileAvatar = useCallback(async (file: Blob, filename?: string) => {
    const nextUser = await uploadAvatar(file, filename);
    setUser(nextUser);
  }, []);

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
      await refresh({ background: false });
      return 'switched';
    }

    setUser(null);
    return 'auth';
  }, [accounts, removeAccount, refresh, user]);

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
