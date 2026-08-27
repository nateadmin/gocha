import { buildCharacterAvatarDataUriFromHash } from './characterAvatarCore';

async function sha256Hex(seed: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export {
  buildCharacterAvatarDataUriFromHash,
  isSvgAvatarUrl,
  profileAvatarInitials,
  profileAvatarSeed,
} from './characterAvatarCore';

export async function buildCharacterAvatarDataUri(seed: string): Promise<string> {
  const hash = await sha256Hex(seed);
  return buildCharacterAvatarDataUriFromHash(hash);
}
