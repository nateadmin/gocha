import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchAppMeta, type AccountChannel } from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { normalizeIdentifier } from '../../auth/accountChannel';
import { confirmPhoneSms, sendPhoneSms } from '../../auth/phoneFirebase';
import { ProfileAvatar, SettingsToggleRow } from '../../components/app';
import { RecaptchaLegalNote } from '../../components/auth/RecaptchaLegalNote';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { useAuth } from '../../context/AuthContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function ProfileSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user, updateProfile, uploadProfileAvatar, requestAuthCode, verifyWithOtp } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [optionalContact, setOptionalContact] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [discoverable, setDiscoverable] = useState(user?.discoverable ?? false);
  const [pendingAvatar, setPendingAvatar] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState('avatar.png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    setStatus(user.status ?? '');
    setBio(user.bio ?? '');
    setDiscoverable(user.discoverable);
    if (!user.emailVerified && user.email) {
      setOptionalContact(user.email);
    } else if (!user.phoneVerified && user.phone) {
      setOptionalContact(user.phone);
    }
  }, [user]);

  async function pickAvatar() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setPendingAvatar(file);
      setPendingFilename(file.name);
      setAvatarPreview(URL.createObjectURL(file));
    };
    input.click();
  }

  async function handleLinkContact() {
    const channel: AccountChannel = !user?.emailVerified ? 'email' : 'phone';
    const normalized = normalizeIdentifier(channel, optionalContact);
    if (!normalized) {
      setError(channel === 'email' ? 'Enter an email.' : 'Enter a phone number.');
      return;
    }
    if (channel === 'email' && !normalized.includes('@')) {
      setError('Enter a valid email.');
      return;
    }

    setLinkLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!linkSent) {
        await requestAuthCode(normalized, 'link', { channel });
        if (channel === 'phone') {
          const meta = await fetchAppMeta();
          if (!meta.auth.firebase) {
            throw new Error('Phone verification is not configured yet.');
          }
          await sendPhoneSms(meta.auth.firebase, normalized);
        }
        setOptionalContact(normalized);
        setLinkSent(true);
        setMessage('Code sent.');
        return;
      }

      const digits = linkCode.replace(/\D/g, '');
      if (digits.length !== 6) {
        setError('Enter the 6-digit code.');
        return;
      }
      let firebaseIdToken: string | undefined;
      if (channel === 'phone') {
        firebaseIdToken = await confirmPhoneSms(digits);
      }
      await verifyWithOtp(normalized, digits, 'link', { channel, firebaseIdToken });
      setOptionalContact('');
      setLinkCode('');
      setLinkSent(false);
      setMessage(channel === 'email' ? 'Email added.' : 'Phone added.');
    } catch (err) {
      setError(formatApiError(err, 'Could not verify that contact.'));
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleSave() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Your name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({
        displayName: trimmedName,
        status: status.trim() || undefined,
        bio: bio.trim() || undefined,
        discoverable,
      });

      if (pendingAvatar) {
        try {
          await uploadProfileAvatar(pendingAvatar, pendingFilename);
        } catch {
          setMessage('Profile saved. Avatar upload failed; try again.');
          return;
        }
      }

      setMessage('Profile saved.');
      setPendingAvatar(null);
      setAvatarPreview(null);
    } catch (err) {
      setError(formatApiError(err, 'Could not save your profile.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Settings</Text>
        </Pressable>

        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.serif,
            fontSize: 28,
            marginBottom: 16,
          }}>
          Edit profile
        </Text>

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
          <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>
            Change photo
          </Text>
        </Pressable>

        <BrandInput
          placeholder="Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
        />
        <Pressable
          onPress={() => navigation.navigate('UsernameSettings')}
          style={[
            styles.linkCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, fontFamily: theme.typography.sans }}>
              Username
            </Text>
            <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 16 }}>
              {user?.username ? `@${user.username}` : 'Set username'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <BrandInput placeholder="Status" value={status} onChangeText={setStatus} />
        <BrandInput
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          style={styles.bio}
        />
        <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans, fontSize: 13 }}>
          Email {user?.emailVerified ? '(verified)' : user?.email ? '(unverified)' : '(optional)'}
        </Text>
        <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 16 }}>
          {user?.email ?? 'Not added'}
        </Text>
        <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans, fontSize: 13 }}>
          Phone {user?.phoneVerified ? '(verified)' : user?.phone ? '(unverified)' : '(optional)'}
        </Text>
        <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 16 }}>
          {user?.phone ?? 'Not added'}
        </Text>
        {(!user?.emailVerified || !user?.phoneVerified) ? (
          <>
            <BrandInput
              placeholder={!user?.emailVerified ? 'Add email' : 'Add phone with country code'}
              value={optionalContact}
              onChangeText={(text) => {
                setOptionalContact(text);
                setLinkSent(false);
                setLinkCode('');
              }}
              autoCapitalize="none"
              keyboardType={!user?.emailVerified ? 'email-address' : 'phone-pad'}
              autoComplete={!user?.emailVerified ? 'email' : 'tel'}
            />
            {linkSent ? (
              <BrandInput
                placeholder="6-digit code"
                value={linkCode}
                onChangeText={(text) => setLinkCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
              />
            ) : null}
            <CtaButton
              label={linkSent ? 'Verify contact' : 'Send verification code'}
              loading={linkLoading}
              onPress={() => {
                void handleLinkContact();
              }}
            />
            {user?.emailVerified && !user?.phoneVerified ? <RecaptchaLegalNote /> : null}
          </>
        ) : null}

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

        {error ? (
          <Text style={{ color: theme.colors.destructive, fontFamily: theme.typography.sans }}>{error}</Text>
        ) : null}
        {message ? (
          <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>{message}</Text>
        ) : null}

        <CtaButton label="Save profile" loading={loading} onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bio: { minHeight: 88, textAlignVertical: 'top' },
  toggleCard: { borderWidth: 1, paddingHorizontal: 12 },
});
