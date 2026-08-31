/**
 * @format
 */

import { listingsForTab, pickListingsTab } from '../src/business/listingsTabs';

test('opens drafts when there are no live listings', () => {
  expect(pickListingsTab([{ status: 'draft' }, { status: 'rejected' }])).toBe('drafts');
});

test('opens live when an approved listing exists', () => {
  expect(pickListingsTab([{ status: 'draft' }, { status: 'approved' }])).toBe('live');
});

test('drafts tab hides live and pending rows', () => {
  const rows = listingsForTab(
    [{ status: 'draft' }, { status: 'approved' }, { status: 'pending_review' }],
    'drafts',
  );
  expect(rows.map((row) => row.status)).toEqual(['draft']);
});
