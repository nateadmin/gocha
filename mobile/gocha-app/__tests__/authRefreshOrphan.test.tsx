/**
 * @format
 */

jest.mock('../src/api/client', () => ({
  ...jest.requireActual('../src/api/client'),
  fetchCurrentUser: jest.fn(),
  getActiveDeviceToken: jest.fn(() => null),
  logout: jest.fn().mockResolvedValue(undefined),
  clearSession: jest.fn().mockResolvedValue(undefined),
  primeCsrfCookie: jest.fn().mockResolvedValue(undefined),
}));

import React, { useEffect } from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { fetchCurrentUser } from '../src/api/client';
import { AccountsProvider } from '../src/context/AccountsContext';
import { AuthProvider, useAuthGate } from '../src/context/AuthContext';

function AuthProbe({
  onReady,
}: {
  onReady: (value: { appPhase: string }) => void;
}) {
  const gate = useAuthGate();

  useEffect(() => {
    onReady({ appPhase: gate.appPhase });
  }, [gate.appPhase, onReady]);

  return null;
}

describe('AuthProvider orphan session', () => {
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

  test('does not restore a user when local accounts are empty', async () => {
    fetchCurrentUserMock.mockResolvedValue({
      id: 1,
      email: 'google-review@gocha.ai',
      phone: null,
      emailVerified: true,
      phoneVerified: false,
      primaryLoginChannel: 'email',
      displayName: 'Google Review',
      username: null,
      chatDisplayName: 'Google Review',
      status: null,
      bio: null,
      language: 'en',
      avatarUrl: null,
      discoverable: false,
      needsOnboarding: false,
      isAdmin: false,
      userVerificationStatus: 'none',
      effectiveVerificationStatus: 'none',
      profileMode: 'personal' as const,
      businessChatName: null,
      businessChatWebsite: null,
      activeBusinessListingId: null,
      activeBusinessListing: null,
    });

    let latest = { appPhase: 'main' };

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

    expect(latest.appPhase).toBe('auth');
  });
});
