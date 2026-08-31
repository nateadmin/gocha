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
