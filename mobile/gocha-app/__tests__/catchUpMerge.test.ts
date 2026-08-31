import { mergeCatchUp } from '../src/catchup/mergeCatchUp';
import type { CatchUpPayload } from '../src/api/client';

function payload(overrides: Partial<CatchUpPayload> = {}): CatchUpPayload {
  return {
    briefing: 'Hello',
    generatedAt: '2026-08-31T00:00:00Z',
    attention: [{ id: '1:0', conversationId: 1, tone: 'warning', text: 'Reply' }],
    conversations: [
      {
        id: 1,
        name: 'Bob',
        avatarUrl: null,
        avatarLabel: 'B',
        unreadCount: 1,
        priority: 'High',
        summary: 'Old summary',
        plans: ['Friday'],
      },
    ],
    ...overrides,
  };
}

test('mergeCatchUp patches conversations by id and keeps briefing from the next payload', () => {
  const merged = mergeCatchUp(
    payload(),
    payload({
      briefing: "You're caught up.",
      conversations: [
        {
          id: 1,
          name: 'Bob',
          avatarUrl: null,
          avatarLabel: 'B',
          unreadCount: 0,
          priority: 'Low',
          summary: 'New summary',
          plans: [],
        },
      ],
      attention: [],
    }),
  );

  expect(merged.briefing).toBe("You're caught up.");
  expect(merged.conversations).toHaveLength(1);
  expect(merged.conversations[0].summary).toBe('New summary');
  expect(merged.conversations[0].unreadCount).toBe(0);
  expect(merged.attention).toEqual([]);
});
