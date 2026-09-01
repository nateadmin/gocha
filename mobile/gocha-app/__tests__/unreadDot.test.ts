import { UNREAD_DOT_BORDER_WIDTH, UNREAD_DOT_SIZE } from '../src/components/app/UnreadDot';

describe('UnreadDot', () => {
  it('keeps the logo and account-menu dots the same size', () => {
    expect(UNREAD_DOT_SIZE).toBe(10);
    expect(UNREAD_DOT_BORDER_WIDTH).toBe(2);
  });
});
