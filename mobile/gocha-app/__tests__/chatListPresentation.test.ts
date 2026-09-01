import { chatListAvatarBadge } from '../src/chat/chatListPresentation';

describe('chatListAvatarBadge', () => {
  it('does not show group member count as an unread-style badge', () => {
    expect(
      chatListAvatarBadge({
        isGroup: true,
        groupCount: 3,
        unreadCount: 0,
      }),
    ).toBeUndefined();
  });

  it('does not move unread onto the avatar', () => {
    expect(
      chatListAvatarBadge({
        isGroup: false,
        groupCount: undefined,
        unreadCount: 4,
      }),
    ).toBeUndefined();
  });
});
