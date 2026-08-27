import { sha256Hex } from './sha256Hex';

function buildCharacterAvatarSvgFromHash(hash: string): string {
  const primary = `#${hash.slice(0, 6)}`;
  const accent = `#${hash.slice(6, 12)}`;
  const eyeY = 68 + (parseInt(hash.slice(12, 14), 16) % 10);
  const mouth =
    parseInt(hash.slice(14, 16), 16) % 2 === 0
      ? `<path d="M70 98 Q100 112 130 98" stroke="${accent}" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : `<line x1="78" y1="102" x2="122" y2="102" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Gocha character avatar">
  <rect width="200" height="200" rx="32" fill="${primary}"/>
  <rect x="36" y="40" width="128" height="120" rx="28" fill="#1a1b2e"/>
  <circle cx="78" cy="${eyeY}" r="10" fill="${accent}"/>
  <circle cx="122" cy="${eyeY}" r="10" fill="${accent}"/>
  ${mouth}
  <rect x="62" y="24" width="18" height="18" rx="4" fill="${accent}"/>
  <rect x="120" y="24" width="18" height="18" rx="4" fill="${accent}"/>
</svg>`;
}

export function profileAvatarSeed(input: {
  email?: string | null;
  id?: number;
  displayName?: string | null;
}): string {
  return input.email || (input.id != null ? String(input.id) : input.displayName || 'gocha');
}

export function buildCharacterAvatarDataUriFromHash(hash: string): string {
  const svg = buildCharacterAvatarSvgFromHash(hash);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildCharacterAvatarDataUri(seed: string): string {
  return buildCharacterAvatarDataUriFromHash(sha256Hex(seed));
}

export function isSvgAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const normalized = url.split('?')[0]?.toLowerCase() ?? '';
  return normalized.endsWith('.svg') || normalized.startsWith('data:image/svg+xml');
}

export function profileAvatarInitials(displayName?: string | null): string {
  const parts = (displayName ?? 'Gocha')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'G';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
