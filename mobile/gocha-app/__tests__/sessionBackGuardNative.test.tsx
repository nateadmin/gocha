/**
 * A signed-in native session used to crash into the error fallback because
 * SessionBackGuard called window.history.pushState (RN defines window, not history).
 */
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../src/theme/fonts', () => ({
  useBrandFonts: () => ({ ready: true }),
  brandFontFamilies: {},
}));
jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthGate: () => ({ user: { id: 1 }, loading: false, appPhase: 'main' }),
}));
jest.mock('../src/context/AccountsContext', () => ({
  AccountsProvider: ({ children }: { children: React.ReactNode }) => children,
  useAccounts: () => ({ isAddingAccount: false }),
}));
jest.mock('../src/chat/ChatContext', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../src/i18n/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../src/navigation/RootNavigator', () => ({ RootNavigator: () => null }));
jest.mock('../src/navigation/AuthNavigator', () => ({ AuthNavigator: () => null }));
jest.mock('../src/screens/auth/OnboardingScreen', () => ({ OnboardingScreen: () => null }));
jest.mock('../src/screens/chats/PublicProfileCardScreen', () => ({ PublicProfileCardScreen: () => null }));
jest.mock('../src/screens/status/StatusComposerScreen', () => ({ StatusComposerScreen: () => null }));
jest.mock('../src/screens/status/StatusViewerScreen', () => ({ StatusViewerScreen: () => null }));

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

jest.setTimeout(20000);

test('signed-in native session renders without the error fallback', async () => {
  expect((globalThis as { history?: unknown }).history).toBeUndefined();
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  let tree!: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Let the splash gate's minimum display time elapse.
  await ReactTestRenderer.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  const texts = tree.root.findAllByType(Text).map((node) => String(node.props.children));
  expect(texts.join(' ')).not.toContain('Something went wrong');
  errorSpy.mockRestore();
  ReactTestRenderer.act(() => tree.unmount());
});
