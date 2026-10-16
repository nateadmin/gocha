/**
 * ChatDetailScreen used to call a hook after its `!chat` early return, so a chat
 * that loaded after the first render threw "Rendered more hooks than during the
 * previous render" (and the reverse threw when the chat disappeared).
 */
const mockCtx: { chat: unknown } = { chat: undefined };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn(), getParent: () => undefined }),
  useRoute: () => ({ params: { chatId: '42' } }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/components/app', () => ({
  Avatar: () => null,
  ConfirmDialog: () => null,
  HeaderOverflowMenu: () => null,
  UniversalLoader: () => null,
}));
jest.mock('../src/components/chat', () => ({
  ActionSheet: () => null,
  ChatComposer: () => null,
  DurationPickerSheet: () => null,
  MessageBubble: () => null,
  TypingIndicator: () => null,
}));
jest.mock('../src/components/chat/GroupPostComposer', () => ({ GroupPostComposer: () => null }));
jest.mock('../src/components/status/StatusRing', () => ({ StatusRing: () => null }));
jest.mock('../src/navigation/rootNavigation', () => ({ openStatusViewer: jest.fn() }));
jest.mock('../src/i18n/LanguageContext', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
jest.mock('../src/theme', () => {
  const colors = new Proxy({}, { get: () => '#000' });
  return {
    useGochaTheme: () => ({
      theme: {
        colors,
        typography: { sans: 'System' },
        radii: { pill: 99, card: 8 },
        overlayMenu: { headerZIndex: 1 },
      },
    }),
  };
});
jest.mock('../src/chat/ChatContext', () => ({
  useChat: () => ({
    getChat: () => mockCtx.chat,
    messagesFor: () => [],
    getChatDraft: () => '',
    setChatDraft: jest.fn(),
    ensureMessagesLoaded: jest.fn(() => Promise.resolve()),
    openChat: jest.fn(),
    ensureConversationLoaded: jest.fn(() => new Promise(() => undefined)),
    refreshMessagesForChat: jest.fn(() => Promise.resolve()),
    refreshTypingForChat: jest.fn(() => Promise.resolve()),
    isChatTyping: () => false,
    typingLabelNames: () => [],
    getEffectiveDisappearingTimer: () => null,
    preferences: { defaultDisappearingTimerSec: null },
    stickerEmoji: {},
  }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { ChatDetailScreen } from '../src/screens/chats/ChatDetailScreen';

const chat = {
  id: '42',
  name: 'Ada',
  avatarLabel: 'A',
  avatarColor: '#111',
  pinned: false,
  muted: false,
  isSecret: false,
  hidden: false,
  blocked: false,
  isGroup: false,
  isBroadcast: false,
  isOrderAssistant: false,
  groupCount: 0,
};

function mount(): ReactTestRenderer.ReactTestRenderer {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<ChatDetailScreen />);
  });
  return tree;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('chat that loads after the first render does not crash', () => {
  mockCtx.chat = undefined;
  const tree = mount();
  mockCtx.chat = chat;
  expect(() => ReactTestRenderer.act(() => tree.update(<ChatDetailScreen />))).not.toThrow();
  ReactTestRenderer.act(() => tree.unmount());
});

test('chat that disappears while open does not crash', () => {
  mockCtx.chat = chat;
  const tree = mount();
  mockCtx.chat = undefined;
  expect(() => ReactTestRenderer.act(() => tree.update(<ChatDetailScreen />))).not.toThrow();
  ReactTestRenderer.act(() => tree.unmount());
});
