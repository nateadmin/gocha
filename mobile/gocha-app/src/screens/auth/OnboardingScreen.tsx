import { useEffect, useState } from 'react';
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
import { formatApiError } from '../../api/formatApiError';
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
  const [username, setUsername] = useState(user?.username ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [discoverable, setDiscoverable] = useState(user?.discoverable ?? false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<Blob | null>(null);
  const [pendingFilename, setPendingFilename] = useState('avatar.png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fallbackName =
      user.displayName && user.displayName !== 'Gocha user' ? user.displayName : '';
    setDisplayName(fallbackName);
    setUsername(user.username ?? '');
    setStatus(user.status ?? '');
    setBio(user.bio ?? '');
    setPhone(user.phone?.replace(/^\++/, '') ?? '');
    setDiscoverable(user.discoverable);
    if (!pendingAvatar && user.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    }
  }, [user, pendingAvatar]);

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
      await finishOnboarding({
        displayName: trimmedName,
        username: username.trim() || undefined,
        status: status.trim() || undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        discoverable,
      });

      if (pendingAvatar) {
        try {
          await uploadProfileAvatar(pendingAvatar, pendingFilename);
        } catch {
          // Profile is already saved; avatar can be retried later.
        }
      }
    } catch (err) {
      setError(formatApiError(err, 'Could not save your profile.'));
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
          <BrandText muted>
            {user?.needsOnboarding
              ? 'Finish your profile to start using Gocha. Your progress is saved when you continue.'
              : 'Tell people who you are on Gocha.'}
          </BrandText>

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
            placeholder="Username (optional, for @tags)"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
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
