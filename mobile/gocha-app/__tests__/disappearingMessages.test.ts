import {
  applyDisappearingToMessage,
  disappearingSettingSummary,
  effectiveDisappearingTimerSec,
  filterExpiredMessages,
  formatDurationLabel,
  isMessageExpired,
} from '../src/chat/disappearingMessages';

describe('disappearingMessages', () => {
  test('inherits the account default when override is undefined', () => {
    expect(effectiveDisappearingTimerSec(undefined, 300)).toBe(300);
    expect(effectiveDisappearingTimerSec(undefined, null)).toBeNull();
  });

  test('uses per-chat off or custom overrides', () => {
    expect(effectiveDisappearingTimerSec(null, 300)).toBeNull();
    expect(effectiveDisappearingTimerSec(60, 300)).toBe(60);
  });

  test('formats duration labels', () => {
    expect(formatDurationLabel(30)).toBe('30 seconds');
    expect(formatDurationLabel(60)).toBe('1 minute');
    expect(formatDurationLabel(3600)).toBe('1 hour');
    expect(formatDurationLabel(86400)).toBe('1 day');
  });

  test('summarizes inherit, off, and custom chat settings', () => {
    expect(disappearingSettingSummary(undefined, null)).toBe('Use account default (Off)');
    expect(disappearingSettingSummary(undefined, 300)).toBe('Use account default (5 minutes)');
    expect(disappearingSettingSummary(null, 300)).toBe('Off for this chat');
    expect(disappearingSettingSummary(60, 300)).toBe('1 minute');
  });

  test('applies expiry metadata to outgoing messages', () => {
    const message = applyDisappearingToMessage(
      {
        id: '1',
        type: 'text',
        text: 'Hi',
        sentAt: '1:00 PM',
        sentAtMs: 1_000,
        isOutgoing: true,
      },
      30,
    );

    expect(message.selfDestructSec).toBe(30);
    expect(message.expiresAtMs).toBe(31_000);
  });

  test('filters expired messages', () => {
    const messages = [
      {
        id: 'live',
        type: 'text',
        text: 'Still here',
        sentAt: '1:00 PM',
        sentAtMs: 1_000,
        isOutgoing: true,
      },
      {
        id: 'gone',
        type: 'text',
        text: 'Expired',
        sentAt: '1:00 PM',
        sentAtMs: 1_000,
        expiresAtMs: 2_000,
        isOutgoing: true,
      },
    ];

    expect(isMessageExpired(messages[1], 2_500)).toBe(true);
    expect(filterExpiredMessages(messages, 2_500).map((message) => message.id)).toEqual(['live']);
  });
});
