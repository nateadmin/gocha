import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { formatApiError } from '../../api/formatApiError';
import {
  createProfileCard,
  deleteProfileCard,
  fetchProfileCard,
  globalSearch,
  grantProfileCardAccess,
  updateProfileCard,
  uploadProfileCardPhoto,
  type ProfileCardBody,
  type ProfileCardType,
  type ProfileCardVisibility,
  type PublicUserProfile,
} from '../../api/client';
import { copyText } from '../../utils/copyText';
import { ConfirmDialog, LoadingShell } from '../../components/app';
import { BrandInput, CtaButton } from '../../components/brand';
import { PROFILE_CARD_TYPES } from '../../profileCards/profileCardMeta';
import { profileCardShareUrl } from '../../profileCards/shareUrl';
import { openPublicProfileCard } from '../../navigation/rootNavigation';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

const VISIBILITY_OPTIONS: { value: ProfileCardVisibility; label: string; hint: string }[] = [
  { value: 'public', label: 'Public', hint: 'Anyone who opens your profile can view it.' },
  { value: 'request', label: 'Request only', hint: 'Listed as private. Others ask; you approve.' },
  { value: 'private', label: 'Private', hint: 'Hidden until you share it with someone.' },
];

export function EditProfileCardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const route = useRoute<RouteProp<SettingsStackParamList, 'EditProfileCard'>>();
  const { theme } = useGochaTheme();
  const cardId = route.params?.cardId;
  const initialType = route.params?.type ?? 'custom';

  const [loading, setLoading] = useState(Boolean(cardId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [type, setType] = useState<ProfileCardType>(initialType);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [visibility, setVisibility] = useState<ProfileCardVisibility>('request');
  const [body, setBody] = useState<ProfileCardBody>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ file: Blob; name: string } | null>(null);

  const [shareQuery, setShareQuery] = useState('');
  const [shareResults, setShareResults] = useState<PublicUserProfile[]>([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!cardId) {
      const meta = PROFILE_CARD_TYPES.find((item) => item.type === initialType);
      setTitle(meta?.label ?? '');
      return;
    }

    fetchProfileCard(cardId)
      .then((card) => {
        setType(card.type);
        setTitle(card.title);
        setSlug(card.slug ?? '');
        setHeadline(card.headline ?? '');
        setVisibility(card.visibility);
        setBody(card.body ?? {});
        setPhotoUrl(card.photoUrl);
      })
      .catch((err) => setError(formatApiError(err, 'Could not load this profile.')))
      .finally(() => setLoading(false));
  }, [cardId, initialType]);

  useEffect(() => {
    const trimmed = shareQuery.trim();
    if (trimmed.length < 2) {
      setShareResults([]);
      return;
    }
    const handle = setTimeout(() => {
      globalSearch(trimmed)
        .then((payload) => setShareResults(payload.people.slice(0, 8)))
        .catch(() => setShareResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [shareQuery]);

  function patchBody(patch: Partial<ProfileCardBody>) {
    setBody((prev) => ({ ...prev, ...patch }));
  }

  async function pickPhoto() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setPendingPhoto({ file, name: file.name });
      setPhotoUrl(URL.createObjectURL(file));
    };
    input.click();
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        type,
        title: title.trim() || undefined,
        slug: slug.trim() || undefined,
        headline: headline.trim() || undefined,
        visibility,
        body,
      };
      const saved = cardId
        ? await updateProfileCard(cardId, payload)
        : await createProfileCard(payload);

      if (pendingPhoto) {
        await uploadProfileCardPhoto(saved.id, pendingPhoto.file, pendingPhoto.name);
        setPendingPhoto(null);
      }

      setMessage('Profile saved.');
      setSlug(saved.slug ?? slug);
      if (!cardId) {
        navigation.replace('EditProfileCard', { cardId: saved.id });
      }
    } catch (err) {
      setError(formatApiError(err, 'Could not save this profile.'));
    } finally {
      setSaving(false);
    }
  }

  async function shareWith(user: PublicUserProfile) {
    if (!cardId) {
      setError('Save the profile before sharing it.');
      return;
    }
    setSharing(true);
    setError(null);
    try {
      await grantProfileCardAccess(cardId, user.id);
      setMessage(`Shared with ${user.displayName}. They will see it on your profile.`);
      setShareQuery('');
      setShareResults([]);
    } catch (err) {
      setError(formatApiError(err, 'Could not share this profile.'));
    } finally {
      setSharing(false);
    }
  }

  async function remove() {
    if (!cardId) return;
    try {
      await deleteProfileCard(cardId);
      navigation.navigate('ProfileCards');
    } catch (err) {
      setError(formatApiError(err, 'Could not delete this profile.'));
    }
  }

  if (loading) {
    return <LoadingShell label="Loading profile" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Back</Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 16,
        }}>
        {cardId ? title || 'Edit profile' : 'New profile'}
      </Text>

      <Pressable onPress={pickPhoto} style={styles.photoWrap}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: theme.colors.muted }]}>
            <Ionicons name="camera-outline" size={28} color={theme.colors.mutedForeground} />
          </View>
        )}
        <Text style={{ color: theme.colors.primary, marginTop: 8 }}>Add photo</Text>
      </Pressable>

      <FieldLabel label="Title" />
      <BrandInput value={title} onChangeText={setTitle} placeholder="Profile name" />

      <FieldLabel label="Headline" />
      <BrandInput value={headline} onChangeText={setHeadline} placeholder="Short intro" />

      {cardId && slug ? (
        <>
          <FieldLabel label="Link" />
          <BrandInput
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginTop: 6 }}>
            {profileCardShareUrl(slug)}
          </Text>
          <View style={styles.linkActions}>
            <CtaButton
              label={message === 'Copied' ? 'Copied' : 'Copy link'}
              compact
              onPress={() => {
                void copyText(profileCardShareUrl(slug)).then((ok) => {
                  if (ok) setMessage('Copied');
                });
              }}
            />
            <CtaButton
              label="View page"
              compact
              onPress={() => openPublicProfileCard(slug)}
            />
          </View>
        </>
      ) : null}

      {type === 'professional' ? (
        <>
          <FieldLabel label="Company" />
          <BrandInput value={body.company ?? ''} onChangeText={(value) => patchBody({ company: value })} />
          <FieldLabel label="Role" />
          <BrandInput value={body.role ?? ''} onChangeText={(value) => patchBody({ role: value })} />
          <FieldLabel label="Location" />
          <BrandInput value={body.location ?? ''} onChangeText={(value) => patchBody({ location: value })} />
          <FieldLabel label="Skills" />
          <BrandInput
            value={body.skills ?? ''}
            onChangeText={(value) => patchBody({ skills: value })}
            placeholder="Comma separated"
          />
          <FieldLabel label="Website" />
          <BrandInput
            value={body.website ?? ''}
            onChangeText={(value) => patchBody({ website: value })}
            autoCapitalize="none"
          />
        </>
      ) : null}

      {type === 'match' ? (
        <>
          <FieldLabel label="Location" />
          <BrandInput value={body.location ?? ''} onChangeText={(value) => patchBody({ location: value })} />
          <FieldLabel label="Looking for" />
          <BrandInput value={body.lookingFor ?? ''} onChangeText={(value) => patchBody({ lookingFor: value })} />
          <FieldLabel label="Interests" />
          <BrandInput value={body.interests ?? ''} onChangeText={(value) => patchBody({ interests: value })} />
        </>
      ) : null}

      {type === 'custom' ? (
        <>
          <FieldLabel label="Details" />
          <BrandInput
            value={body.details ?? ''}
            onChangeText={(value) => patchBody({ details: value })}
            multiline
          />
        </>
      ) : null}

      <FieldLabel label="About" />
      <BrandInput
        value={body.about ?? ''}
        onChangeText={(value) => patchBody({ about: value })}
        multiline
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />

      <FieldLabel label="Visibility" />
      <View style={styles.visibilityRow}>
        {VISIBILITY_OPTIONS.map((option) => {
          const active = visibility === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setVisibility(option.value)}
              style={[
                styles.visibilityChip,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.muted : theme.colors.card,
                },
              ]}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontSize: 13,
                  fontWeight: active ? '600' : '400',
                }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginBottom: 16 }}>
        {VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.hint}
      </Text>

      {cardId ? (
        <>
          <FieldLabel label="Share with someone" />
          <BrandInput
            value={shareQuery}
            onChangeText={setShareQuery}
            placeholder="Search a person"
            autoCapitalize="none"
          />
          {shareResults.map((person) => (
            <Pressable
              key={person.id}
              disabled={sharing}
              onPress={() => void shareWith(person)}
              style={[styles.shareRow, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.cardForeground, flex: 1 }}>{person.displayName}</Text>
              <Text style={{ color: theme.colors.primary }}>Share</Text>
            </Pressable>
          ))}
        </>
      ) : null}

      {error ? <Text style={{ color: theme.colors.destructive, marginVertical: 8 }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.primary, marginVertical: 8 }}>{message}</Text> : null}

      <CtaButton label={cardId ? 'Save' : 'Create profile'} loading={saving} onPress={() => void save()} />

      {cardId ? (
        <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteBtn}>
          <Text style={{ color: theme.colors.destructive, textAlign: 'center' }}>Delete profile</Text>
        </Pressable>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this profile?"
        message="People you shared it with will lose access."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </ScrollView>
  );
}

function FieldLabel({ label }: { label: string }) {
  const { theme } = useGochaTheme();
  return (
    <Text
      style={{
        color: theme.colors.mutedForeground,
        fontSize: 12,
        textTransform: 'uppercase',
        marginTop: 14,
        marginBottom: 6,
      }}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  photoWrap: { alignItems: 'center', marginBottom: 8 },
  photo: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  visibilityRow: { flexDirection: 'row', gap: 8 },
  visibilityChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkActions: {
    marginTop: 12,
    gap: 10,
  },
  shareRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deleteBtn: { marginTop: 20, paddingVertical: 12 },
});
