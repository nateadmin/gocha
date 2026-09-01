import {
  ACCOUNT_SWITCH_HOLD_MS,
  isStatusSwipeUp,
  isStatusTap,
  nextAuthorIndex,
  nextBackground,
  nextStatusIndex,
  previousAuthorIndex,
  previousStatusIndex,
  shouldAdvanceStatus,
  statusDurationMs,
  statusExpiresLabel,
  statusPlaylistUserIds,
  statusProgressRatio,
  statusRingTone,
  tapSide,
  tickStatusElapsed,
} from '../src/status/statusLogic';

describe('statusLogic', () => {
  it('uses 5s for text and image and clamps video', () => {
    expect(statusDurationMs({ type: 'text' })).toBe(5000);
    expect(statusDurationMs({ type: 'image' })).toBe(5000);
    expect(statusDurationMs({ type: 'video', durationMs: 8000 })).toBe(8000);
    expect(statusDurationMs({ type: 'video', durationMs: 90000 })).toBe(30000);
    expect(statusDurationMs({ type: 'video', durationMs: 500 })).toBe(3000);
  });

  it('builds avatar ring tones', () => {
    expect(statusRingTone(false, false)).toBeNull();
    expect(statusRingTone(true, true)).toBe('unseen');
    expect(statusRingTone(true, false)).toBe('seen');
  });

  it('advances and steps back like a story viewer', () => {
    expect(nextStatusIndex(0, 3)).toBe(1);
    expect(nextStatusIndex(2, 3)).toBeNull();
    expect(previousStatusIndex(2)).toBe(1);
    expect(previousStatusIndex(0)).toBe(0);
    expect(tapSide(20, 400)).toBe('prev');
    expect(tapSide(300, 400)).toBe('next');
  });

  it('cycles status background colors', () => {
    expect(nextBackground('#1B00D8')).toBe('#00669c');
    expect(nextBackground('#unknown')).toBe('#1B00D8');
  });

  it('resumes hold-to-pause from elapsed time', () => {
    expect(statusProgressRatio(2500, 5000)).toBe(0.5);
    expect(statusProgressRatio(5000, 5000)).toBe(1);
    const paused = tickStatusElapsed(1200, null, 10_000);
    expect(paused.elapsedMs).toBe(1200);
    const resumed = tickStatusElapsed(paused.elapsedMs, paused.lastTickMs, 10_400);
    expect(resumed.elapsedMs).toBe(1600);
    expect(statusProgressRatio(resumed.elapsedMs, 5000)).toBe(0.32);
  });

  it('does not advance while the status is held or paused', () => {
    expect(shouldAdvanceStatus(true, false)).toBe(false);
    expect(shouldAdvanceStatus(false, true)).toBe(false);
    expect(shouldAdvanceStatus(true, true)).toBe(false);
    expect(shouldAdvanceStatus(false, false)).toBe(true);
  });

  it('treats a long hold as pause not a tap, and swipe up as a reply gesture', () => {
    expect(isStatusTap(120, false)).toBe(true);
    expect(isStatusTap(2000, false)).toBe(false);
    expect(isStatusSwipeUp(400, 330)).toBe(true);
    expect(isStatusSwipeUp(400, 380)).toBe(false);
    expect(ACCOUNT_SWITCH_HOLD_MS).toBe(1000);
  });

  it('builds a global status playlist from the feed', () => {
    expect(
      statusPlaylistUserIds(
        [
          { userId: 4, itemCount: 2 },
          { userId: 8, itemCount: 0 },
          { userId: 9, itemCount: 1 },
        ],
        { userId: 1, itemCount: 1 },
      ),
    ).toEqual([4, 9, 1]);
    expect(nextAuthorIndex(0, 3)).toBe(1);
    expect(nextAuthorIndex(2, 3)).toBeNull();
    expect(previousAuthorIndex(2)).toBe(1);
  });

  it('labels remaining status lifetime', () => {
    const now = Date.parse('2026-09-01T12:00:00.000Z');
    expect(statusExpiresLabel('2026-09-01T14:00:00.000Z', now)).toBe('Expires in 2 hours');
    expect(statusExpiresLabel('2026-09-01T12:20:00.000Z', now)).toBe('Expires in 20 minutes');
    expect(statusExpiresLabel('2026-09-01T11:00:00.000Z', now)).toBe('Expired');
  });
});
