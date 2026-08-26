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
} from '../api/client';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  signInWithOtp: (email: string, code: string) => Promise<void>;
  requestLoginCode: (email: string) => Promise<{ resendAvailableInSeconds: number }>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearError = useCallback(() => setError(null), []);

  const requestLoginCode = useCallback(async (email: string) => {
    const payload = await requestOtp(email);
    return { resendAvailableInSeconds: payload.resendAvailableInSeconds };
  }, []);

  const signInWithOtp = useCallback(async (email: string, code: string) => {
    const nextUser = await verifyOtp(email, code);
    setUser(nextUser);
    setError(null);
  }, []);

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
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      clearError,
      refresh,
      signInWithOtp,
      requestLoginCode,
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
      signInWithOtp,
      requestLoginCode,
      finishOnboarding,
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
