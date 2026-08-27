import { useMemo, useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { isSvgAvatarUrl, profileAvatarInitials } from '../../branding/characterAvatarCore';
import { useGochaTheme } from '../../theme';
import { Avatar } from './Avatar';

type Props = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  userId?: number;
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function ProfileAvatar({
  avatarUrl,
  displayName,
  userId,
  size = 56,
  style,
  accessibilityLabel = 'Profile avatar',
}: Props) {
  const { theme } = useGochaTheme();
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => profileAvatarInitials(displayName), [displayName]);

  const remoteUri = avatarUrl && !failed ? avatarUrl : null;
  const canUseRemoteImage = remoteUri && !isSvgAvatarUrl(remoteUri);

  if (!canUseRemoteImage) {
    return <Avatar label={initials} size={size} color={theme.colors.primary} />;
  }

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      source={{ uri: remoteUri }}
      onError={() => setFailed(true)}
      style={[
        {
          width: size,
          height: size,
          borderRadius: theme.radii.avatar,
          backgroundColor: theme.colors.muted,
        },
        style,
      ]}
    />
  );
}
