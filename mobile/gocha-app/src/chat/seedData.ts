import {
  ORDER_ASSISTANT_CHAT_ID,
  ORDER_ASSISTANT_DEFAULT_NAME,
} from './orderAssistant';
import type { ChatMessage, ChatRecord } from './types';

export const STICKER_PACKS = [
  {
    id: 'gotcha',
    name: 'Gocha',
    stickers: ['rocket', 'star', 'fire', 'party', 'heart', 'thumbs', 'wave', 'cool'],
  },
  {
    id: 'neon',
    name: 'Neon',
    stickers: ['bolt', 'moon', 'sun', 'ghost', 'cat', 'dog', 'coffee', 'pizza'],
  },
] as const;

export const STICKER_EMOJI: Record<string, string> = {
  rocket: '🚀',
  star: '⭐',
  fire: '🔥',
  party: '🎉',
  heart: '❤️',
  thumbs: '👍',
  wave: '👋',
  cool: '😎',
  bolt: '⚡',
  moon: '🌙',
  sun: '☀️',
  ghost: '👻',
  cat: '🐱',
  dog: '🐶',
  coffee: '☕',
  pizza: '🍕',
};

export const EMOJI_GRID = [
  '😀', '😂', '🥰', '😎', '🤔', '😴', '😭', '🤯',
  '👍', '👎', '🙏', '👋', '💪', '🤝', '✌️', '🫶',
  '❤️', '💙', '💜', '💚', '🔥', '⭐', '✨', '💯',
  '🎉', '🎊', '🏆', '🎯', '🚀', '⚡', '🌙', '☀️',
  '🍕', '☕', '🍺', '🌮', '🍣', '🍩', '🍦', '🥤',
  '🐶', '🐱', '🦊', '🐸', '🦄', '🐼', '🐧', '🦋',
];

export function createOrderAssistantChat(): ChatRecord {
  return {
    id: ORDER_ASSISTANT_CHAT_ID,
    name: ORDER_ASSISTANT_DEFAULT_NAME,
    avatarLabel: 'GA',
    avatarColor: '#5b42f3',
    preview: 'Ask me anything. I am here to help.',
    dateLabel: 'Today',
    lastActivityAt: Date.now() + 1000,
    unreadCount: 0,
    pinned: true,
    archived: false,
    muted: false,
    blocked: false,
    locked: false,
    hidden: false,
    favorite: false,
    markedUnread: false,
    isGroup: false,
    isBusiness: false,
    isOrderAssistant: true,
    isSecret: false,
    listIds: [],
    labelIds: [],
  };
}

export function createOrderAssistantMessages(): ChatMessage[] {
  return [
    {
      id: 'welcome',
      type: 'text',
      text:
        'Hi. I am Gocha AI. Ask me questions, get help planning, writing, or finding local options.',
      sentAt: 'Now',
      isOutgoing: false,
    },
  ];
}
