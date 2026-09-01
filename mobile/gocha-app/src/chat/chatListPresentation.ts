import type { ChatRecord } from './types';

/**
 * Chat-list avatars must not show member count. That badge uses the same
 * primary pill as unread mail, so a new group looks like unread messages.
 * Member count stays on the thread header and Chat info.
 */
export function chatListAvatarBadge(
  _chat: Pick<ChatRecord, 'isGroup' | 'groupCount' | 'unreadCount'>,
): number | undefined {
  return undefined;
}
