import { Image, Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ProfileCardBody, ProfileCardType } from '../../api/client';
import { BrandLogo } from '../brand/BrandLogo';
import { CtaButton } from '../brand/CtaButton';
import { profileCardIcon } from '../../profileCards/profileCardMeta';
import { useGochaTheme } from '../../theme';

type Props = {
  displayName: string;
  title: string;
  type: ProfileCardType;
  headline?: string | null;
  photoUrl?: string | null;
  body: ProfileCardBody;
  primaryLabel: string;
  primaryLoading?: boolean;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onLogoPress?: () => void;
};

export function ProfileCardPage({
  displayName,
  title,
  type,
  headline,
  photoUrl,
  body,
  primaryLabel,
  primaryLoading,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onLogoPress,
}: Props) {
  const { theme } = useGochaTheme();

  return (
    <View style={styles.page}>
      {onLogoPress ? (
        Platform.OS === 'web' ? (
          <button
            type="button"
            onClick={onLogoPress}
            aria-label="Gocha"
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              alignSelf: 'center',
            }}>
            <BrandLogo size={56} />
          </button>
        ) : (
          <Pressable onPress={onLogoPress} accessibilityRole="button" style={styles.logoBtn}>
            <BrandLogo size={56} />
          </Pressable>
        )
      ) : (
        <View style={styles.logoBtn}>
          <BrandLogo size={56} />
        </View>
      )}

      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback, { backgroundColor: theme.colors.muted }]}>
          <Ionicons name={profileCardIcon(type)} size={40} color={theme.colors.primary} />
        </View>
      )}

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 32,
          textAlign: 'center',
          marginTop: 16,
        }}>
        {displayName}
      </Text>
      <Text
        style={{
          color: theme.colors.primary,
          fontFamily: theme.typography.sans,
          fontSize: 15,
          textAlign: 'center',
          marginTop: 6,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
        {title}
      </Text>
      {headline ? (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 16,
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 22,
          }}>
          {headline}
        </Text>
      ) : null}

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <DetailRow label="Company" value={body.company} />
        <DetailRow label="Role" value={body.role} />
        <DetailRow label="Location" value={body.location} />
        <DetailRow label="Looking for" value={body.lookingFor} />
        <DetailRow label="Skills" value={body.skills} />
        <DetailRow label="Interests" value={body.interests} />
        <DetailRow label="Website" value={body.website} />
        <DetailRow label="About" value={body.about} />
        <DetailRow label="Details" value={body.details} />
      </View>

      <View style={styles.actions}>
        <CtaButton label={primaryLabel} loading={primaryLoading} onPress={onPrimary} />
        {secondaryLabel && onSecondary ? (
          Platform.OS === 'web' ? (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                marginTop: 12,
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 10,
                paddingTop: 12,
                paddingBottom: 12,
                color: theme.colors.cardForeground,
                fontSize: 15,
                cursor: 'pointer',
                width: '100%',
              }}>
              {secondaryLabel}
            </button>
          ) : (
            <Pressable
              onPress={onSecondary}
              style={[styles.secondary, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.cardForeground, fontSize: 15, textAlign: 'center' }}>
                {secondaryLabel}
              </Text>
            </Pressable>
          )
        ) : null}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  const { theme } = useGochaTheme();
  if (!value) return null;
  return (
    <View style={[styles.row, { borderColor: theme.colors.border }]}>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
      <Text style={{ color: theme.colors.cardForeground, fontSize: 16, marginTop: 4, lineHeight: 22 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingBottom: 24,
  },
  logoBtn: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignSelf: 'center',
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    marginTop: 24,
  },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
});
