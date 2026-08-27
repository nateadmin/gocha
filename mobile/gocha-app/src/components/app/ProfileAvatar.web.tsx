import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import {
  buildCharacterAvatarDataUri,
  isSvgAvatarUrl,
  profileAvatarSeed,
} from '../../branding/characterAvatarCore';
import { useGochaTheme } from '../../theme';

type Props = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  userId?: number;
  size?: number;
  style?: CSSProperties;
  accessibilityLabel?: string;
};

export function ProfileAvatar({
  avatarUrl,
  displayName,
  email,
  userId,
  size = 56,
  style,
  accessibilityLabel = 'Profile avatar',
}: Props) {
  const { theme } = useGochaTheme();
  const [failed, setFailed] = useState(false);
  const seed = useMemo(
    () => profileAvatarSeed({ email, id: userId, displayName }),
    [displayName, email, userId],
  );
  const generatedUri = useMemo(() => buildCharacterAvatarDataUri(seed), [seed]);
  const uploadedUri = avatarUrl && !failed && !isSvgAvatarUrl(avatarUrl) ? avatarUrl : null;
  const remoteSvgUri = avatarUrl && !failed && isSvgAvatarUrl(avatarUrl) ? avatarUrl : null;
  const uri = uploadedUri ?? remoteSvgUri ?? generatedUri;

  return (
    <img
      alt={accessibilityLabel}
      src={uri}
      onError={() => {
        if (avatarUrl && !failed) {
          setFailed(true);
        }
      }}
      style={{
        width: size,
        height: size,
        borderRadius: theme.radii.avatar,
        backgroundColor: theme.colors.muted,
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
