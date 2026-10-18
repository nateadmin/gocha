/**
 * Opening a status used to throw on native: the viewer registered
 * window.addEventListener, which React Native does not provide.
 */
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({ goBack: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dispatch: jest.fn() }),
    useRoute: () => ({ params: { userId: 7 } }),
    useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]),
    CommonActions: { navigate: jest.fn() },
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/api/client', () => ({
  deleteStatus: jest.fn(),
  fetchStatusViewers: jest.fn(),
  fetchUserStatuses: jest.fn(() => new Promise(() => {})),
  markStatusViewed: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/api/formatApiError', () => ({ formatApiError: () => 'err' }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 } }) }));
jest.mock('../src/chat/ChatContext', () => ({
  useChat: () => ({ startDirectMessage: jest.fn(), sendTextMessage: jest.fn() }),
}));
jest.mock('../src/i18n/LanguageContext', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
jest.mock('../src/components/app', () => ({
  ConfirmDialog: () => null,
  ProfileAvatar: () => null,
  UniversalLoader: () => null,
}));
jest.mock('../src/components/status/StatusVideo', () => ({ StatusVideo: () => null }));
jest.mock('../src/theme', () => ({
  useGochaTheme: () => ({ theme: { colors: { background: '#000' } } }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { StatusViewerScreen } from '../src/screens/status/StatusViewerScreen';

test('StatusViewerScreen mounts and unmounts on native without throwing', () => {
  expect((globalThis as { addEventListener?: unknown }).addEventListener).toBeUndefined();
  let tree!: ReactTestRenderer.ReactTestRenderer;

  expect(() =>
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<StatusViewerScreen />);
    }),
  ).not.toThrow();
  expect(() => ReactTestRenderer.act(() => tree.unmount())).not.toThrow();
});
