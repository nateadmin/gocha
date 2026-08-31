export type ListingsTabId = 'live' | 'drafts' | 'pending';

export function pickListingsTab(listings: Array<{ status: string }>): ListingsTabId {
  if (listings.some((item) => item.status === 'approved')) {
    return 'live';
  }
  if (listings.some((item) => item.status === 'pending_review')) {
    return 'pending';
  }
  return 'drafts';
}

export function listingsForTab<T extends { status: string }>(listings: T[], tab: ListingsTabId): T[] {
  switch (tab) {
    case 'live':
      return listings.filter((item) => item.status === 'approved');
    case 'pending':
      return listings.filter((item) => item.status === 'pending_review');
    case 'drafts':
      return listings.filter((item) => ['draft', 'unpublished', 'rejected'].includes(item.status));
    default:
      return listings;
  }
}
