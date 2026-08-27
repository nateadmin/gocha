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

import { formatApiError } from '../../api/formatApiError';
import { ProfileAvatar, SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand/CtaButton';
import { BrandInput } from '../../components/brand/BrandInput';
import { useAuth } from '../../context/AuthContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function ProfileSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user, updateProfile, uploadProfileAvatar } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
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
    setPhone(user.phone?.replace(/^\++/, '') ?? '');
    setDiscoverable(user.discoverable);
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
        phone: phone.trim() || undefined,
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
