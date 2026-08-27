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
    avatarLabel: 'BC',
    avatarColor: '#5b42f3',
    preview: 'Tell me what you need. I will find the best option.',
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
        'Hi. I am your Gocha assistant. Tell me what you need and I will find the best local option, prepare your request, and help you book or order.',
      sentAt: 'Now',
      isOutgoing: false,
    },
  ];
}
