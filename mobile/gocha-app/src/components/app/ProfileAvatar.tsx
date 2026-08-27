import { useMemo, useState } from 'react';
import { Image, View, type ImageStyle, type StyleProp } from 'react-native';

import {
  buildCharacterAvatarDataUri,
  isSvgAvatarUrl,
  profileAvatarInitials,
  profileAvatarSeed,
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
  const initials = useMemo(() => profileAvatarInitials(displayName), [displayName]);

  const remoteUri = avatarUrl && !failed ? avatarUrl : null;
  const canUseRemoteImage = remoteUri && !isSvgAvatarUrl(remoteUri);
  const sourceUri = canUseRemoteImage ? remoteUri : generatedUri;

  if (!canUseRemoteImage && isSvgAvatarUrl(remoteUri)) {
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
        source={{ uri: sourceUri }}
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
