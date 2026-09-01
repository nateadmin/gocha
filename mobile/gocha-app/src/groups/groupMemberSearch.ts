import type { GlobalSearchContactResult, PublicUserProfile } from '../api/client';
import type { ChatRecord } from '../chat/types';

function emptyProfile(id: number, displayName: string, username: string | null, avatarUrl: string | null): PublicUserProfile {
  return {
    id,
    username,
    displayName,
    status: null,
    bio: null,
    avatarUrl,
    verificationStatus: 'none',
    profileMode: 'personal',
    website: null,
    chatUserId: id,
  };
}

export function profileFromLocalChat(chat: ChatRecord): PublicUserProfile | null {
  if (!chat.otherUserId || chat.isGroup) {
    return null;
  }

  return emptyProfile(chat.otherUserId, chat.name, null, null);
}

export function profileFromSearchContact(contact: GlobalSearchContactResult): PublicUserProfile {
  return emptyProfile(contact.userId, contact.displayName, contact.username, contact.avatarUrl);
}

export function mergeGroupMemberResults(input: {
  local: PublicUserProfile[];
  contacts: PublicUserProfile[];
  people: PublicUserProfile[];
  excludeIds: Iterable<number>;
}): PublicUserProfile[] {
  const excluded = new Set(input.excludeIds);
  const byId = new Map<number, PublicUserProfile>();
  const order: number[] = [];

  for (const profile of [...input.local, ...input.contacts, ...input.people]) {
    if (excluded.has(profile.id)) {
      continue;
    }
    const existing = byId.get(profile.id);
    if (existing) {
      if (!existing.username && profile.username) {
        existing.username = profile.username;
      }
      if (!existing.avatarUrl && profile.avatarUrl) {
        existing.avatarUrl = profile.avatarUrl;
      }
      continue;
    }
    byId.set(profile.id, profile);
    order.push(profile.id);
  }

  return order.map((id) => byId.get(id)!);
}
