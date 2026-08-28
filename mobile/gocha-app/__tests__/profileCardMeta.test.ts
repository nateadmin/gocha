import { cardActionLabel, visibilityLabel } from '../src/profileCards/profileCardMeta';
import type { ProfileCardSummary } from '../src/api/client';

function card(overrides: Partial<ProfileCardSummary> = {}): ProfileCardSummary {
  return {
    id: 1,
    type: 'professional',
    title: 'Professional',
    visibility: 'request',
    canView: false,
    accessStatus: null,
    photoUrl: null,
    headline: null,
    ...overrides,
  };
}

describe('profileCardMeta', () => {
  it('labels request and private cards as private until opened', () => {
    expect(visibilityLabel('request')).toBe('Private profile');
    expect(visibilityLabel('private')).toBe('Private profile');
    expect(visibilityLabel('public')).toBe('Public profile');
  });

  it('picks the action a viewer should see', () => {
    expect(cardActionLabel(card())).toBe('Request access');
    expect(cardActionLabel(card({ accessStatus: 'pending' }))).toBe('Request pending');
    expect(cardActionLabel(card({ canView: true }))).toBe('View');
    expect(cardActionLabel(card({ visibility: 'private' }))).toBeNull();
  });
});
