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

import { fetchAppMeta, type AccountChannel } from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { normalizeIdentifier } from '../../auth/accountChannel';
import { getPhoneRecaptchaToken } from '../../auth/phoneRecaptcha';
import { ProfileAvatar, SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { BrandText } from '../../components/brand/BrandText';
import { ScreenContainer } from '../../components/app/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

export function OnboardingScreen() {
  const { theme } = useGochaTheme();
  const { user, finishOnboarding, uploadProfileAvatar, requestAuthCode, verifyWithOtp } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [optionalContact, setOptionalContact] = useState('');
  const [linkStep, setLinkStep] = useState(false);
  const [linkCode, setLinkCode] = useState('');
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

  const optionalChannel: AccountChannel = user?.primaryLoginChannel === 'phone' ? 'email' : 'phone';

  async function requestOptionalLink(identifier: string): Promise<void> {
    let recaptchaToken: string | undefined;
    if (optionalChannel === 'phone') {
      const meta = await fetchAppMeta();
      if (!meta.auth.firebase) {
        throw new Error('Phone verification is not configured yet.');
      }
      recaptchaToken = await getPhoneRecaptchaToken(meta.auth.firebase);
    }
    await requestAuthCode(identifier, 'link', { channel: optionalChannel, recaptchaToken });
  }

  async function saveProfileAndAvatar(): Promise<void> {
    const trimmedName = displayName.trim();
    await finishOnboarding({
      displayName: trimmedName,
      username: username.trim() || undefined,
      status: status.trim() || undefined,
      bio: bio.trim() || undefined,
      discoverable,
    });

    if (pendingAvatar) {
      try {
        await uploadProfileAvatar(pendingAvatar, pendingFilename);
      } catch {
        // Profile is already saved; avatar can be retried later.
      }
    }
  }

  async function handleSubmit() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Your name is required.');
      return;
    }

    const optional = optionalContact.trim();
    if (optional && !linkStep) {
      const normalized = normalizeIdentifier(optionalChannel, optional);
      if (optionalChannel === 'email' && !normalized.includes('@')) {
        setError('Enter a valid email.');
        return;
      }
      if (optionalChannel === 'phone' && normalized.length < 9) {
        setError('Enter a valid phone number.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await requestOptionalLink(normalized);
        setOptionalContact(normalized);
        setLinkStep(true);
      } catch (err) {
        setError(formatApiError(err, 'Could not send a verification code.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (linkStep) {
        const digits = linkCode.replace(/\D/g, '');
        if (digits.length !== 6) {
          setError('Enter the 6-digit code.');
          setLoading(false);
          return;
        }
        await verifyWithOtp(normalizeIdentifier(optionalChannel, optionalContact), digits, 'link', {
          channel: optionalChannel,
        });
      }
      await saveProfileAndAvatar();
    } catch (err) {
      setError(formatApiError(err, 'Could not save your profile.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipOptional() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Your name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await saveProfileAndAvatar();
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
            {pendingAvatar && avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatar} />
            ) : (
              <ProfileAvatar
                avatarUrl={user?.avatarUrl}
                displayName={displayName || user?.displayName}
                email={user?.email}
                userId={user?.id}
                size={96}
                style={styles.avatar}
              />
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
          {linkStep ? (
            <BrandInput
              placeholder="6-digit code"
              value={linkCode}
              onChangeText={(text) => setLinkCode(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />
          ) : (
            <BrandInput
              placeholder={optionalChannel === 'email' ? 'Email (optional)' : 'Phone (optional)'}
              value={optionalContact}
              onChangeText={setOptionalContact}
              autoCapitalize="none"
              keyboardType={optionalChannel === 'email' ? 'email-address' : 'phone-pad'}
              autoComplete={optionalChannel === 'email' ? 'email' : 'tel'}
            />
          )}

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

          <CtaButton
            label={linkStep ? 'Verify and continue' : 'Continue'}
            loading={loading}
            onPress={handleSubmit}
          />
          {optionalContact.trim() || linkStep ? (
            <Pressable onPress={() => { void handleSkipOptional(); }}>
              <BrandText muted style={{ textAlign: 'center' }}>
                Skip {optionalChannel === 'email' ? 'email' : 'phone'}
              </BrandText>
            </Pressable>
          ) : null}
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
