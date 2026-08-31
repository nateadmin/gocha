import {
  nextBackground,
  nextStatusIndex,
  previousStatusIndex,
  statusDurationMs,
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
});
