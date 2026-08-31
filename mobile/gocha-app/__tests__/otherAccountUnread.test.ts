import {
  otherAccountUnreadIds,
  shouldShowAccountLogoBadge,
  unreadMapsEqual,
} from '../src/accounts/otherAccountUnread';

describe('otherAccountUnread', () => {
  const accounts = [{ userId: 1 }, { userId: 2 }, { userId: 3 }];

  it('badges only inactive accounts that have unread mail', () => {
    const unreadIds = otherAccountUnreadIds(accounts, 1, {
      1: true,
      2: true,
      3: false,
    });
    expect(unreadIds).toEqual([2]);
    expect(shouldShowAccountLogoBadge(unreadIds)).toBe(true);
  });

  it('hides the logo badge when every other account is caught up', () => {
    expect(shouldShowAccountLogoBadge(otherAccountUnreadIds(accounts, 1, { 2: false, 3: false }))).toBe(
      false,
    );
    expect(shouldShowAccountLogoBadge([])).toBe(false);
  });

  it('compares unread maps by user id', () => {
    expect(unreadMapsEqual({ 2: true }, { 2: true })).toBe(true);
    expect(unreadMapsEqual({ 2: true }, { 2: false })).toBe(false);
    expect(unreadMapsEqual({ 2: true }, { 2: true, 3: false })).toBe(false);
  });
});
