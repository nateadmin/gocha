/**
 * App Store blockers: consent gate (1.2 / 5.1.2), account deletion (5.1.1(v)),
 * block and report (1.2), and hiding features native cannot do yet (2.1).
 */
const mockAuth = {
  user: null as unknown,
  completeConsent: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve('auth')),
};

jest.mock('../src/context/AuthContext', () => {
  const actual = jest.requireActual('../src/context/AuthContext');
  return { ...actual, useAuth: () => mockAuth };
});
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

import React from 'react';
import { Share, Switch, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import type { AuthUser } from '../src/api/client';
import { needsConsent } from '../src/context/AuthContext';
import { ConsentScreen } from '../src/screens/auth/ConsentScreen';
import { OnboardingScreen } from '../src/screens/auth/OnboardingScreen';
import { ThemeProvider } from '../src/theme';
import { PHONE_SIGN_IN_SUPPORTED } from '../src/auth/phoneSupport';
import { MEDIA_PICKING_SUPPORTED } from '../src/chat/pickMedia';
import { VOICE_RECORDING_SUPPORTED } from '../src/chat/voiceRecording';
import { copyText } from '../src/utils/copyText';

function user(overrides: Partial<AuthUser>): AuthUser {
  return { id: 1, needsOnboarding: false, ...overrides } as AuthUser;
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map((node) => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)))
    .join(' ');
}

describe('consent gate', () => {
  test('asks when terms or the AI choice are explicitly missing', () => {
    expect(needsConsent(user({ termsAccepted: false, aiConsentDecided: true }))).toBe(true);
    expect(needsConsent(user({ termsAccepted: true, aiConsentDecided: false }))).toBe(true);
    expect(needsConsent(user({ termsAccepted: true, aiConsentDecided: true }))).toBe(false);
  });

  test('an older API without these fields never traps users', () => {
    expect(needsConsent(user({}))).toBe(false);
  });
});

describe('ConsentScreen', () => {
  beforeEach(() => {
    mockAuth.completeConsent.mockClear();
  });

  function render() {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ThemeProvider>
          <ConsentScreen />
        </ThemeProvider>,
      );
    });
    return tree;
  }

  function continueButton(tree: ReactTestRenderer.ReactTestRenderer) {
    return tree.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function' && node.props.disabled !== undefined,
    )[0];
  }

  test('requires agreeing to the rules and sends the AI choice (off by default)', async () => {
    mockAuth.user = user({ termsAccepted: false, aiConsentDecided: false });
    const tree = render();

    expect(textOf(tree)).toContain('zero tolerance for objectionable content');
    expect(textOf(tree)).toContain('OpenAI');
    expect(continueButton(tree).props.disabled).toBe(true);

    const checkbox = tree.root.findAll((node) => node.props.accessibilityRole === 'checkbox')[0];
    ReactTestRenderer.act(() => checkbox.props.onPress());
    expect(continueButton(tree).props.disabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      await continueButton(tree).props.onPress();
    });
    expect(mockAuth.completeConsent).toHaveBeenCalledWith({ acceptTerms: true, aiEnabled: false });
  });

  test('turning on AI features is sent as an explicit opt-in', async () => {
    mockAuth.user = user({ termsAccepted: true, aiConsentDecided: false });
    const tree = render();

    expect(textOf(tree)).not.toContain('Community rules');
    ReactTestRenderer.act(() => tree.root.findByType(Switch).props.onValueChange(true));
    await ReactTestRenderer.act(async () => {
      await continueButton(tree).props.onPress();
    });
    expect(mockAuth.completeConsent).toHaveBeenCalledWith({ acceptTerms: false, aiEnabled: true });
  });
});

describe('API calls', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'ok', user: { id: 1 } }),
    });
    (globalThis as { fetch: unknown }).fetch = fetchMock;
  });

  function lastCall(): { url: string; method: string; body: unknown } {
    const calls = fetchMock.mock.calls.filter(([url]) => !String(url).includes('csrf-cookie'));
    const [url, init] = calls[calls.length - 1];
    return { url: String(url), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(init.body) : undefined };
  }

  test('delete account sends the explicit confirmation', async () => {
    const { deleteAccount } = require('../src/api/client');
    await deleteAccount();
    expect(lastCall()).toMatchObject({ method: 'POST', body: { confirm: 'DELETE' } });
    expect(lastCall().url).toContain('/api/account/delete');
  });

  test('block, unblock and report hit the safety endpoints', async () => {
    const { blockUser, unblockUser, reportContent } = require('../src/api/client');

    await blockUser(7);
    expect(lastCall()).toMatchObject({ method: 'POST', body: { userId: 7 } });
    expect(lastCall().url).toContain('/api/blocks');

    await unblockUser(7);
    expect(lastCall().method).toBe('DELETE');
    expect(lastCall().url).toContain('/api/blocks/7');

    await reportContent({ reason: 'spam', messageId: 12 });
    expect(lastCall()).toMatchObject({ method: 'POST', body: { reason: 'spam', messageId: 12 } });
    expect(lastCall().url).toContain('/api/reports');
  });
});

describe('native onboarding', () => {
  test('does not offer an avatar picker that cannot work on a phone', () => {
    mockAuth.user = user({ displayName: 'Ada', email: 'ada@example.com', primaryLoginChannel: 'email', avatarUrl: null });
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ThemeProvider>
          <OnboardingScreen />
        </ThemeProvider>,
      );
    });
    expect(textOf(tree)).not.toContain('Add avatar');
    expect(textOf(tree)).toContain('character icon');
    ReactTestRenderer.act(() => tree.unmount());
  });
});

describe('native capabilities (jest runs as a phone)', () => {
  test('features native cannot do yet are switched off', () => {
    expect(PHONE_SIGN_IN_SUPPORTED).toBe(false);
    expect(MEDIA_PICKING_SUPPORTED).toBe(false);
    expect(VOICE_RECORDING_SUPPORTED).toBe(false);
  });

  test('copy uses the share sheet on native instead of doing nothing', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    await expect(copyText('https://app.gocha.ai/c/ada')).resolves.toBe(true);
    expect(share).toHaveBeenCalledWith({ message: 'https://app.gocha.ai/c/ada' });
    share.mockRestore();
  });
});
