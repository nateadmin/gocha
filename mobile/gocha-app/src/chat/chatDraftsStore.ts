export type ChatDraft = {
  text: string;
  updatedAt: number;
};

const DRAFTS_KEY = 'gocha.chat.drafts.v1';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readStoredChatDrafts(): Record<string, ChatDraft> {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, ChatDraft>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredChatDrafts(drafts: Record<string, ChatDraft>): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function upsertStoredChatDraft(chatId: string, text: string): Record<string, ChatDraft> {
  const drafts = readStoredChatDrafts();
  const trimmed = text.trim();
  if (!trimmed) {
    delete drafts[chatId];
    writeStoredChatDrafts(drafts);
    return drafts;
  }

  const existing = drafts[chatId];
  if (existing?.text === text) {
    return drafts;
  }

  drafts[chatId] = { text, updatedAt: Date.now() };
  writeStoredChatDrafts(drafts);
  return drafts;
}

export function removeStoredChatDraft(chatId: string): Record<string, ChatDraft> {
  const drafts = readStoredChatDrafts();
  delete drafts[chatId];
  writeStoredChatDrafts(drafts);
  return drafts;
}
