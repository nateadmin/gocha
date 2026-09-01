import { createNavigationContainerRef } from '@react-navigation/native';

import type { AppStackParamList } from './types';

export const appNavigationRef = createNavigationContainerRef<AppStackParamList>();

export function openStatusViewer(userId: number, startItemId?: number, userIds?: number[]): void {
  if (appNavigationRef.isReady()) {
    appNavigationRef.navigate('StatusViewer', { userId, startItemId, userIds });
  }
}

export function openStatusFeed(userIds: number[], startUserId?: number): void {
  const userId = startUserId ?? userIds[0];
  if (userId == null) {
    return;
  }
  openStatusViewer(userId, undefined, userIds);
}

export function openStatusComposer(params?: AppStackParamList['StatusComposer']): void {
  if (appNavigationRef.isReady()) {
    appNavigationRef.navigate('StatusComposer', params ?? {});
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
