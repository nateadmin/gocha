export type StoredDisappearingOverrides = Record<string, number | null>;

const OVERRIDES_KEY = 'gocha.chat.disappearing.v1';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readStoredDisappearingOverrides(): StoredDisappearingOverrides {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as StoredDisappearingOverrides) : {};
  } catch {
    return {};
  }
}

export function writeStoredDisappearingOverrides(overrides: StoredDisappearingOverrides): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function setStoredDisappearingOverride(
  overrides: StoredDisappearingOverrides,
  chatId: string,
  value: number | null | 'inherit',
): StoredDisappearingOverrides {
  const next = { ...overrides };
  if (value === 'inherit') {
    delete next[chatId];
  } else {
    next[chatId] = value;
  }
  return next;
}

export function withDisappearingOverrides<T extends { id: string }>(
  chats: T[],
  overrides: StoredDisappearingOverrides,
): (T & { disappearingOverride?: number | null })[] {
  return chats.map((chat) => {
    if (!(chat.id in overrides)) {
      return chat;
    }
    return { ...chat, disappearingOverride: overrides[chat.id] };
  });
}
