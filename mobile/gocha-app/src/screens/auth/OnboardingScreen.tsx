import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';

import { ApiError } from '../../api/client';
import { SettingsToggleRow } from '../../components/app/SettingsToggleRow';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

export function OnboardingScreen() {
  const { theme } = useGochaTheme();
  const { user, finishOnboarding, uploadProfileAvatar } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [discoverable, setDiscoverable] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<Blob | null>(null);
  const [pendingFilename, setPendingFilename] = useState('avatar.png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAvatar() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      setPendingAvatar(file);
      setPendingFilename(file.name);
      setAvatarPreview(URL.createObjectURL(file));
    };
    input.click();
  }

  async function handleSubmit() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Your name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (pendingAvatar) {
        await uploadProfileAvatar(pendingAvatar, pendingFilename);
      }

      await finishOnboarding({
        displayName: trimmedName,
        status: status.trim() || undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        discoverable,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <BrandText variant="title">Set up your profile</BrandText>
          <BrandText muted>Tell people who you are on Gotcha.</BrandText>

          <Pressable onPress={pickAvatar} style={styles.avatarRow}>
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' },
                ]}>
                <BrandText variant="label">Avatar</BrandText>
              </View>
            )}
            <BrandText style={{ color: theme.colors.primary }}>Add avatar (optional)</BrandText>
          </Pressable>
          <BrandText muted>
            Skip avatar and we generate a character icon for you.
          </BrandText>

          <BrandInput
            placeholder="Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />
          <BrandInput
            placeholder="Status"
            value={status}
            onChangeText={setStatus}
          />
          <BrandInput
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            style={styles.bio}
          />
          <BrandInput
            placeholder="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <View
            style={[
              styles.toggleCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.card,
              },
            ]}>
            <SettingsToggleRow
              icon="search-outline"
              label="Discoverable in search"
              value={discoverable}
              onValueChange={setDiscoverable}
            />
          </View>
          <BrandText muted>
            When off, global search will not return your profile by name or email.
          </BrandText>

          {error ? (
            <BrandText style={{ color: theme.colors.destructive }}>{error}</BrandText>
          ) : null}

          <CtaButton label="Continue" loading={loading} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 24,
    gap: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  bio: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  toggleCard: {
    borderWidth: 1,
    paddingHorizontal: 12,
  },
});
