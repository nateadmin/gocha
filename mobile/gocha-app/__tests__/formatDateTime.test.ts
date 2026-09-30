import {
  formatActivityLabel,
  formatClockTime,
  formatIsoClockTime,
  formatIsoNumericDate,
  formatNumericDate,
} from '../src/utils/formatDateTime';
import { mapConversationRecord } from '../src/chat/conversationApi';
import { mapMessageRecord } from '../src/chat/messageMapping';
import type { ConversationRecord } from '../src/api/client';

describe('formatDateTime', () => {
  const noon = new Date('2026-09-01T12:05:00');

  it('never passes an empty locale array to Intl (Hermes RangeError)', () => {
    const timeSpy = jest
      .spyOn(Date.prototype, 'toLocaleTimeString')
      .mockImplementation(function (this: Date, locales?: Intl.LocalesArgument) {
        expect(locales).not.toEqual([]);
        return '12:05 PM';
      });
    const dateSpy = jest
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementation(function (this: Date, locales?: Intl.LocalesArgument) {
        expect(locales).not.toEqual([]);
        return '9/1/26';
      });

    expect(formatClockTime(noon)).toBe('12:05 PM');
    expect(formatNumericDate(noon)).toBe('9/1/26');
    expect(formatIsoClockTime('2026-09-01T12:05:00.000Z')).toBeTruthy();
    expect(formatIsoNumericDate('2026-09-01T12:05:00.000Z')).toBeTruthy();

    timeSpy.mockRestore();
    dateSpy.mockRestore();
  });

  it('falls back when Hermes rejects the locale', () => {
    const timeSpy = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => {
      throw new RangeError('Incorrect locale information provided');
    });
    const dateSpy = jest.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(() => {
      throw new RangeError('Incorrect locale information provided');
    });

    expect(formatClockTime(noon)).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    expect(formatNumericDate(noon)).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
    expect(formatActivityLabel(noon.getTime(), noon.getTime())).toMatch(/\d{1,2}:\d{2} (AM|PM)/);

    timeSpy.mockRestore();
    dateSpy.mockRestore();
  });

  it('maps conversations and messages after login without empty locales', () => {
    const timeSpy = jest
      .spyOn(Date.prototype, 'toLocaleTimeString')
      .mockImplementation(function (this: Date, locales?: Intl.LocalesArgument) {
        if (Array.isArray(locales) && locales.length === 0) {
          throw new RangeError('Incorrect locale information provided');
        }
        return '12:00 PM';
      });
    const dateSpy = jest
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementation(function (this: Date, locales?: Intl.LocalesArgument) {
        if (Array.isArray(locales) && locales.length === 0) {
          throw new RangeError('Incorrect locale information provided');
        }
        return '9/1/26';
      });

    const record: ConversationRecord = {
      id: 9,
      type: 'dm',
      name: 'Bob',
      avatarUrl: null,
      avatarLabel: 'B',
      avatarColor: '#1B00D8',
      otherUserId: 4,
      preview: 'Hi',
      lastActivityAt: '2026-09-01T12:00:00.000Z',
      unreadCount: 0,
      isBusiness: false,
    };

    expect(() => mapConversationRecord(record)).not.toThrow();
    expect(mapConversationRecord(record).dateLabel).toBeTruthy();
    expect(() =>
      mapMessageRecord(
        {
          id: '42',
          type: 'text',
          text: 'Hello',
          sentAt: '2026-09-01T12:00:00.000Z',
          senderUserId: 7,
          isOutgoing: false,
          status: 'sent',
        },
        7,
      ),
    ).not.toThrow();

    timeSpy.mockRestore();
    dateSpy.mockRestore();
  });
});
