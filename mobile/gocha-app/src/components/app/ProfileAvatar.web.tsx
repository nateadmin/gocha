import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { buildCharacterAvatarDataUri, profileAvatarSeed } from '../../branding/characterAvatar.web';
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
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const seed = useMemo(
    () => profileAvatarSeed({ email, id: userId, displayName }),
    [displayName, email, userId],
  );

  useEffect(() => {
    let cancelled = false;

    if (avatarUrl && !failed) {
      setGeneratedUri(null);
      return () => {
        cancelled = true;
      };
    }

    buildCharacterAvatarDataUri(seed).then((uri) => {
      if (!cancelled) {
        setGeneratedUri(uri);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [avatarUrl, failed, seed]);

  const uri = avatarUrl && !failed ? avatarUrl : generatedUri;

  return (
    <img
      alt={accessibilityLabel}
      src={uri ?? undefined}
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
        ...style,
      }}
    />
  );
}
