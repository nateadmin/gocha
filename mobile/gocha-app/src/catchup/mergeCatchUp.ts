import type { CatchUpAttentionItem, CatchUpConversationBrief, CatchUpPayload } from '../api/client';

export function mergeCatchUp(
  previous: CatchUpPayload | null,
  next: CatchUpPayload,
): CatchUpPayload {
  if (!previous) {
    return next;
  }

  return {
    briefing: next.briefing,
    generatedAt: next.generatedAt,
    attention: mergeById(previous.attention, next.attention),
    conversations: mergeById(previous.conversations, next.conversations),
  };
}

function mergeById<T extends { id: string | number }>(previous: T[], next: T[]): T[] {
  const previousById = new Map(previous.map((item) => [String(item.id), item]));
  return next.map((item) => {
    const existing = previousById.get(String(item.id));
    return existing ? { ...existing, ...item } : item;
  });
}

export function emptyCatchUp(): CatchUpPayload {
  return {
    briefing: '',
    generatedAt: null,
    attention: [] as CatchUpAttentionItem[],
    conversations: [] as CatchUpConversationBrief[],
  };
}
