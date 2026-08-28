import { profileCardSharePath, profileCardShareUrl } from '../src/profileCards/shareUrl';
import {
  consumeStartSignIn,
  queueDirectChat,
  queueSignInThenDirectChat,
  takePendingDirectChatUserId,
} from '../src/profileCards/postAuthIntent';

describe('profileCardShareUrl', () => {
  it('builds a /c/ path from the slug', () => {
    expect(profileCardSharePath('nate-professional')).toBe('/c/nate-professional');
    expect(profileCardShareUrl('nate-professional')).toMatch(/\/c\/nate-professional$/);
  });
});

describe('postAuthIntent', () => {
  it('queues a direct chat for after sign-in', () => {
    queueSignInThenDirectChat(42);
    expect(consumeStartSignIn()).toBe(true);
    expect(takePendingDirectChatUserId()).toBe(42);
    expect(consumeStartSignIn()).toBe(false);
    expect(takePendingDirectChatUserId()).toBeNull();
  });

  it('queues a direct chat for a signed-in viewer', () => {
    queueDirectChat(7);
    expect(takePendingDirectChatUserId()).toBe(7);
  });
});
