export const STATUS_BACKGROUNDS = [
  '#1B00D8',
  '#00669c',
  '#00734a',
  '#5b42f3',
  '#c45c26',
  '#3d9a8b',
  '#5b8def',
  '#e07a5f',
  '#111827',
  '#7c3aed',
] as const;

export type StatusRingTone = 'unseen' | 'seen' | null;

export function statusDurationMs(item: { type: string; durationMs?: number | null }): number {
  if (item.type === 'video') {
    return Math.min(30000, Math.max(3000, item.durationMs || 15000));
  }
  return item.durationMs && item.durationMs > 0 ? item.durationMs : 5000;
}

export function statusRingTone(hasStatus: boolean, unseen: boolean): StatusRingTone {
  if (!hasStatus) {
    return null;
  }
  return unseen ? 'unseen' : 'seen';
}

export function nextStatusIndex(current: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  if (current + 1 >= total) {
    return null;
  }
  return current + 1;
}

export function previousStatusIndex(current: number): number {
  return Math.max(0, current - 1);
}

export function tapSide(x: number, width: number): 'prev' | 'next' {
  return x < width * 0.35 ? 'prev' : 'next';
}

export function nextBackground(current: string): string {
  const index = STATUS_BACKGROUNDS.indexOf(current as (typeof STATUS_BACKGROUNDS)[number]);
  return STATUS_BACKGROUNDS[(index + 1) % STATUS_BACKGROUNDS.length] ?? STATUS_BACKGROUNDS[0];
}

export function statusProgressRatio(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}

export function tickStatusElapsed(
  elapsedMs: number,
  lastTickMs: number | null,
  nowMs: number,
): { elapsedMs: number; lastTickMs: number } {
  if (lastTickMs == null) {
    return { elapsedMs, lastTickMs: nowMs };
  }
  return { elapsedMs: elapsedMs + (nowMs - lastTickMs), lastTickMs: nowMs };
}

export const ACCOUNT_SWITCH_HOLD_MS = 1000;
export const STATUS_TAP_MAX_MS = 280;
export const STATUS_SWIPE_UP_PX = 56;

export function shouldAdvanceStatus(holding: boolean, paused: boolean): boolean {
  return !holding && !paused;
}

export function isStatusSwipeUp(startY: number, endY: number, minPx = STATUS_SWIPE_UP_PX): boolean {
  return startY - endY >= minPx;
}

export function isStatusTap(holdMs: number, swiped: boolean, tapMaxMs = STATUS_TAP_MAX_MS): boolean {
  return !swiped && holdMs < tapMaxMs;
}

export function statusPlaylistUserIds(
  recent: Array<{ userId: number; itemCount: number }>,
  mine?: { userId: number; itemCount: number } | null,
): number[] {
  const ids = recent.filter((author) => author.itemCount > 0).map((author) => author.userId);
  if (mine && mine.itemCount > 0 && !ids.includes(mine.userId)) {
    ids.push(mine.userId);
  }
  return ids;
}

export function nextAuthorIndex(current: number, total: number): number | null {
  if (total <= 0 || current + 1 >= total) {
    return null;
  }
  return current + 1;
}

export function previousAuthorIndex(current: number): number {
  return Math.max(0, current - 1);
}

export function statusExpiresLabel(expiresAt: string | null | undefined, nowMs = Date.now()): string {
  if (!expiresAt) {
    return '';
  }
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return '';
  }
  const remaining = expiresMs - nowMs;
  if (remaining <= 0) {
    return 'Expired';
  }
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.max(1, Math.round((remaining % 3_600_000) / 60_000));
  if (hours >= 1) {
    return hours === 1 ? 'Expires in 1 hour' : `Expires in ${hours} hours`;
  }
  return minutes === 1 ? 'Expires in 1 minute' : `Expires in ${minutes} minutes`;
}
