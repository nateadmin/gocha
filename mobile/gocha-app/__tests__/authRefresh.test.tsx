/**
 * @format
 */

jest.mock('../src/api/client', () => ({
  ...jest.requireActual('../src/api/client'),
  fetchCurrentUser: jest.fn(),
  getActiveDeviceToken: jest.fn(() => 'device-token'),
  issueDeviceToken: jest.fn(),
}));

import React, { useEffect } from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { ApiError, fetchCurrentUser } from '../src/api/client';
import { AccountsProvider } from '../src/context/AccountsContext';
import { AuthProvider, useAuth, useAuthGate } from '../src/context/AuthContext';

const mockUser = {
  id: 1,
  email: 'nate@example.com',
  phone: null,
  emailVerified: true,
  phoneVerified: false,
  primaryLoginChannel: 'email',
  displayName: 'Nate',
  username: null,
  chatDisplayName: 'Nate',
  status: null,
  bio: null,
  language: 'en',
  avatarUrl: null,
  discoverable: true,
  needsOnboarding: false,
  isAdmin: false,
  userVerificationStatus: 'none',
  effectiveVerificationStatus: 'none',
  profileMode: 'personal' as const,
  businessChatName: null,
  businessChatWebsite: null,
  activeBusinessListingId: null,
  activeBusinessListing: null,
};

function AuthProbe({
  onReady,
}: {
  onReady: (value: { refresh: () => Promise<void>; appPhase: string; error: string | null }) => void;
}) {
  const auth = useAuth();
  const gate = useAuthGate();

  useEffect(() => {
    onReady({ refresh: auth.refresh, appPhase: gate.appPhase, error: auth.error });
  }, [auth.error, auth.refresh, gate.appPhase, onReady]);

  return null;
}

describe('AuthProvider refresh', () => {
  const fetchCurrentUserMock = fetchCurrentUser as jest.Mock;

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
    store.clear();
    fetchCurrentUserMock.mockReset();
  });

  test('preserves the signed-in user when refresh hits a transient server error', async () => {
    fetchCurrentUserMock
      .mockResolvedValueOnce(mockUser)
      .mockRejectedValueOnce(new ApiError({ code: 'INTERNAL', message: 'Server error.' }, 500));

    let latest = {
      refresh: async () => {},
      appPhase: 'auth',
      error: null as string | null,
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AccountsProvider>
          <AuthProvider>
            <AuthProbe
              onReady={(value) => {
                latest = value;
              }}
            />
          </AuthProvider>
        </AccountsProvider>,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await latest.refresh();
    });

    expect(latest.appPhase).toBe('main');
    expect(latest.error).toBe('Server error.');
  });
});
