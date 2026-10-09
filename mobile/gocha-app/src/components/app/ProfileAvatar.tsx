import { useMemo, useState } from 'react';
import { Image, View, type ImageStyle, type StyleProp } from 'react-native';

import {
  isSvgAvatarUrl,
  profileAvatarInitials,
} from '../../branding/characterAvatarCore';
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
  size = 56,
  style,
  accessibilityLabel = 'Profile avatar',
}: Props) {
  const { theme } = useGochaTheme();
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => profileAvatarInitials(displayName), [displayName]);
  const remoteUri = avatarUrl && !failed ? avatarUrl : null;
  const canUseRemoteImage = Boolean(remoteUri && !isSvgAvatarUrl(remoteUri));

  if (!canUseRemoteImage) {
    return (
      <View pointerEvents="none">
        <Avatar label={initials} size={size} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View pointerEvents="none">
      <Image
        accessibilityLabel={accessibilityLabel}
        source={{ uri: remoteUri as string }}
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
    </View>
  );
}
