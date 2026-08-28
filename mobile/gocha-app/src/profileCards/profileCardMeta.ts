import type { ProfileCardSummary, ProfileCardType, ProfileCardVisibility } from '../api/client';

export const PROFILE_CARD_TYPES: {
  type: ProfileCardType;
  label: string;
  description: string;
  icon: 'briefcase-outline' | 'heart-outline' | 'grid-outline';
}[] = [
  {
    type: 'professional',
    label: 'Professional',
    description: 'Work, experience, skills and résumé.',
    icon: 'briefcase-outline',
  },
  {
    type: 'match',
    label: 'Match',
    description: 'Personal details, background and references.',
    icon: 'heart-outline',
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Create a profile for anything else.',
    icon: 'grid-outline',
  },
];

export function profileCardIcon(type: ProfileCardType): 'briefcase-outline' | 'heart-outline' | 'grid-outline' {
  return PROFILE_CARD_TYPES.find((item) => item.type === type)?.icon ?? 'grid-outline';
}

export function visibilityLabel(visibility: ProfileCardVisibility): string {
  switch (visibility) {
    case 'public':
      return 'Public profile';
    case 'private':
      return 'Private profile';
    default:
      return 'Private profile';
  }
}

export function cardActionLabel(card: ProfileCardSummary): string | null {
  if (card.canView) {
    return 'View';
  }
  if (card.accessStatus === 'pending') {
    return 'Request pending';
  }
  if (card.visibility === 'request') {
    return 'Request access';
  }
  return null;
}
