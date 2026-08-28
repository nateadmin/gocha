import { API_BASE_URL } from '../config/api';

export function profileCardShareUrl(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) {
    return '';
  }

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : API_BASE_URL.replace(/\/$/, '');

  return `${origin}/c/${trimmed}`;
}

export function profileCardSharePath(slug: string): string {
  const trimmed = slug.trim();
  return trimmed ? `/c/${trimmed}` : '';
}
