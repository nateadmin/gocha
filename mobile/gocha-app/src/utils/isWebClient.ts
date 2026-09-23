import { Platform } from 'react-native';

export function isWebClient(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}
