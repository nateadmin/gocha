import { createNavigationContainerRef } from '@react-navigation/native';

import type { AppStackParamList } from './types';

export const appNavigationRef = createNavigationContainerRef<AppStackParamList>();

export function openPublicProfileCard(slug: string): void {
  if (!slug) {
    return;
  }
  if (appNavigationRef.isReady()) {
    appNavigationRef.navigate('PublicProfileCard', { slug });
  }
}
