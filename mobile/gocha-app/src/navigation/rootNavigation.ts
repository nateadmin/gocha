import { createNavigationContainerRef } from '@react-navigation/native';

import type { AppStackParamList } from './types';

export const appNavigationRef = createNavigationContainerRef<AppStackParamList>();

export function openStatusViewer(userId: number, startItemId?: number): void {
  if (appNavigationRef.isReady()) {
    appNavigationRef.navigate('StatusViewer', { userId, startItemId });
  }
}

export function openStatusComposer(): void {
  if (appNavigationRef.isReady()) {
    appNavigationRef.navigate('StatusComposer', {});
  }
}

export function openPublicProfileCard(slug: string): void {
  if (!slug) {
    return;
  }
  if (appNavigationRef.isReady()) {
    appNavigationRef.navigate('PublicProfileCard', { slug });
  }
}
