import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ApiError,
  fetchBusinessIndustries,
  fetchMyBusinessListings,
  importGoogleBusiness,
  saveBusinessListingDraft,
  submitBusinessListing,
  submitBusinessListingForReview,
  updateBusinessListing,
  uploadBusinessCover,
  uploadBusinessLogo,
  type BusinessIndustry,
  type OwnerBusinessListing,
} from '../../api/client';
import { IndustryPicker } from '../../components/business/IndustryPicker';
import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand/CtaButton';
import { formatApiError } from '../../api/formatApiError';
import { useAuth } from '../../context/AuthContext';
import type { DiscoverStackParamList, SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

type FormRoute =
  | RouteProp<DiscoverStackParamList, 'BusinessListingForm'>
  | RouteProp<SettingsStackParamList, 'BusinessListingForm'>;

function normalizeWebsite(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function buildPayload(
  name: string,
  category: string,
  description: string,
  address: string,
  noPhysicalAddress: boolean,
  website: string,
  googleUrl: string,
  googlePlaceId: string | null,
  logoImportPath: string | null,
  coverImportPath: string | null,
) {
  return {
    name: name.trim(),
    category: category || undefined,
    description: description.trim() || undefined,
    address: noPhysicalAddress ? undefined : address.trim() || undefined,
    no_physical_address: noPhysicalAddress,
    website: normalizeWebsite(website),
    google_business_url: googleUrl.trim() || undefined,
    google_place_id: googlePlaceId || undefined,
    logo_import_path: logoImportPath || undefined,
    cover_import_path: coverImportPath || undefined,
  };
}

export function BusinessListingFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>();
  const route = useRoute<FormRoute>();
  const listingId = route.params?.listingId;
  const { theme } = useGochaTheme();
  const { user } = useAuth();

  const [savedListingId, setSavedListingId] = useState<number | undefined>(listingId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [noPhysicalAddress, setNoPhysicalAddress] = useState(false);
  const [website, setWebsite] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCover, setPendingCover] = useState<Blob | null>(null);
  const [pendingCoverName, setPendingCoverName] = useState('cover.jpg');
  const [coverImportPath, setCoverImportPath] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<Blob | null>(null);
  const [pendingLogoName, setPendingLogoName] = useState('logo.jpg');
  const [logoImportPath, setLogoImportPath] = useState<string | null>(null);
  const [industries, setIndustries] = useState<BusinessIndustry[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [existing, setExisting] = useState<OwnerBusinessListing | null>(null);

  const loadListing = useCallback(async () => {
    if (!listingId) return;
    const listings = await fetchMyBusinessListings();
    const match = listings.find((item) => item.id === listingId);
    if (!match) {
      setError('Listing not found.');
      return;
    }
    setExisting(match);
    setName(match.name);
    setCategory(match.category ?? '');
    setDescription(match.description ?? '');
    setAddress(match.address ?? '');
    setNoPhysicalAddress(match.noPhysicalAddress);
    setWebsite(match.website ?? '');
    setGoogleUrl(match.googleBusinessUrl ?? '');
    setGooglePlaceId(match.googlePlaceId);
    setCoverPreview(match.coverPhotoUrl);
    setLogoPreview(match.logoPhotoUrl);
  }, [listingId]);

  useEffect(() => {
    fetchBusinessIndustries()
      .then(setIndustries)
      .catch(() => setIndustries([]));
    if (listingId) {
      loadListing().catch(() => setError('Could not load listing.'));
    }
  }, [listingId, loadListing]);

  function pickImage(kind: 'cover' | 'logo') {
    if (typeof document === 'undefined') {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const preview = URL.createObjectURL(file);
      if (kind === 'cover') {
        setPendingCover(file);
        setPendingCoverName(file.name);
        setCoverPreview(preview);
        setCoverImportPath(null);
        return;
      }
      setPendingLogo(file);
      setPendingLogoName(file.name);
      setLogoPreview(preview);
      setLogoImportPath(null);
    };
    input.click();
  }

  async function autoFillFromGoogle() {
    if (!googleUrl.trim()) {
      setError('Paste a Google Business listing link first.');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const imported = await importGoogleBusiness(googleUrl.trim());
      if (imported.name) setName(imported.name);
      if (imported.category) setCategory(imported.category);
      if (imported.description) setDescription(imported.description);
      if (imported.address) setAddress(imported.address);
      setNoPhysicalAddress(imported.noPhysicalAddress);
      if (imported.website) setWebsite(imported.website);
      setGoogleUrl(imported.googleBusinessUrl);
      setGooglePlaceId(imported.googlePlaceId);
      if (imported.logoPhotoUrl) {
        setLogoPreview(imported.logoPhotoUrl);
        setLogoImportPath(imported.logoPhotoPath);
        setPendingLogo(null);
      }
      if (imported.coverPhotoUrl) {
        setCoverPreview(imported.coverPhotoUrl);
        setCoverImportPath(imported.coverPhotoPath);
        setPendingCover(null);
      }
      const filled: string[] = [];
      if (imported.name) filled.push('name');
      if (imported.category) filled.push('industry');
      if (imported.description) filled.push('description');
      if (imported.address) filled.push('address');
      if (imported.website) filled.push('website');
      if (imported.logoPhotoUrl) filled.push('logo');
      if (imported.coverPhotoUrl) filled.push('cover photo');
      if (imported.source === 'places_api') {
        setMessage(
          filled.length > 0
            ? `Auto-filled ${filled.join(', ')} from Google.`
            : 'Google found the place but had no extra fields to fill.',
        );
      } else {
        setMessage(
          filled.length > 0
            ? `Filled ${filled.join(', ')} from the link. Connect Google Places on the server for full auto-fill.`
            : 'Could not read details from that link. Try a full maps.google.com place URL.',
        );
      }
    } catch (err) {
      setError(formatApiError(err, 'Could not read that Google link.'));
    } finally {
      setImporting(false);
    }
  }

  async function persistPhotos(id: number): Promise<string | null> {
    const errors: string[] = [];
    if (pendingCover) {
      try {
        await uploadBusinessCover(id, pendingCover, pendingCoverName);
        setPendingCover(null);
      } catch (err) {
        errors.push(formatApiError(err, 'Cover photo upload failed.'));
      }
    }
    if (pendingLogo) {
      try {
        await uploadBusinessLogo(id, pendingLogo, pendingLogoName);
        setPendingLogo(null);
      } catch (err) {
        errors.push(formatApiError(err, 'Logo upload failed.'));
      }
    }
    return errors.length > 0 ? errors.join(' ') : null;
  }

  function activeListingId(): number | undefined {
    return savedListingId ?? existing?.id ?? listingId;
  }

  async function saveDraft() {
    if (!user) {
      setError('Sign in to save a business listing.');
      return;
    }
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload(
        name,
        category,
        description,
        address,
        noPhysicalAddress,
        website,
        googleUrl,
        googlePlaceId,
        pendingLogo ? null : logoImportPath,
        pendingCover ? null : coverImportPath,
      );
      let listing: OwnerBusinessListing;
      const currentId = activeListingId();
      if (currentId) {
        listing = await saveBusinessListingDraft(currentId, payload);
      } else {
        listing = await submitBusinessListing({ ...payload, submit: false });
        setSavedListingId(listing.id);
      }
      const photoError = await persistPhotos(listing.id);
      setExisting(listing);
      setLogoImportPath(null);
      setCoverImportPath(null);
      setMessage(photoError ? `Draft saved. ${photoError}` : 'Draft saved.');
      const routeNames = navigation.getState()?.routeNames ?? [];
      if (routeNames.includes('MyBusinessListings')) {
        navigation.navigate('MyBusinessListings' as never, { tab: 'drafts' } as never);
      }
    } catch (err) {
      setError(formatApiError(err, 'Could not save draft.'));
    } finally {
      setLoading(false);
    }
  }

  async function submitForReview() {
    if (!user) {
      setError('Sign in to submit a business listing.');
      return;
    }
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload(
        name,
        category,
        description,
        address,
        noPhysicalAddress,
        website,
        googleUrl,
        googlePlaceId,
        pendingLogo ? null : logoImportPath,
        pendingCover ? null : coverImportPath,
      );
      let listing: OwnerBusinessListing;
      const currentId = activeListingId();
      if (currentId) {
        await updateBusinessListing(currentId, payload);
        listing = await submitBusinessListingForReview(currentId);
      } else {
        listing = await submitBusinessListing({ ...payload, submit: true });
        setSavedListingId(listing.id);
      }
      const photoError = await persistPhotos(listing.id);
      setExisting(listing);
      setLogoImportPath(null);
      setCoverImportPath(null);
      setMessage(
        photoError
          ? `Submitted for review. ${photoError}`
          : 'Submitted for review. We will notify you when it is approved.',
      );
    } catch (err) {
      setError(formatApiError(err, 'Could not submit listing.'));
    } finally {
      setLoading(false);
    }
  }

  const readOnly =
    existing?.status === 'pending_review' || existing?.status === 'approved';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        {listingId ? 'Edit business listing' : 'List your business'}
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16, fontFamily: theme.typography.sans }}>
        Paste a Google Maps or Google Business link below to auto-fill details, then review and submit. Listings go live
        after review.
      </Text>

      {readOnly ? (
        <Text style={{ color: theme.colors.primary, marginBottom: 12, fontFamily: theme.typography.sans }}>
          {existing?.status === 'approved'
            ? 'This listing is live. Unpublish it from My listings to edit.'
            : 'This listing is pending review and cannot be edited.'}
        </Text>
      ) : null}

      {!user ? (
        <Text style={{ color: theme.colors.destructive, marginBottom: 12, fontFamily: theme.typography.sans }}>
          Sign in to create or save a business listing.
        </Text>
      ) : null}

      <View
        style={[
          styles.googleCard,
          { backgroundColor: theme.colors.muted, borderColor: theme.colors.border },
        ]}>
        <View style={styles.googleTitle}>
          <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.cardForeground, fontWeight: '600' }}>Auto-fill from Google</Text>
        </View>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
          Paste your Google Maps or Google Business profile link. We fill name, industry, address, website,
          description, logo, and cover photo when Google has them.
        </Text>
        <TextInput
          value={googleUrl}
          onChangeText={setGoogleUrl}
          editable={!readOnly}
          placeholder="https://maps.google.com/..."
          autoCapitalize="none"
          placeholderTextColor={theme.colors.mutedForeground}
          style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
        />
        {!readOnly ? (
          <Pressable
            onPress={autoFillFromGoogle}
            disabled={importing}
            style={[styles.autoFillBtn, { borderColor: theme.colors.primary }]}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>
              {importing ? 'Reading link…' : 'Auto-fill from Google'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={[styles.sectionHeading, { color: theme.colors.cardForeground }]}>Business details</Text>

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Business name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        editable={!readOnly}
        placeholder="Business name"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Description (optional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        editable={!readOnly}
        placeholder="What does this business do?"
        multiline
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, styles.bio, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Industry</Text>
      {readOnly ? (
        <Text style={{ color: theme.colors.cardForeground, marginBottom: 12 }}>{category || '—'}</Text>
      ) : (
        <IndustryPicker value={category} onChange={setCategory} options={industries} />
      )}

      <SettingsToggleRow
        label="No physical address"
        value={noPhysicalAddress}
        onValueChange={(value) => {
          if (!readOnly) setNoPhysicalAddress(value);
        }}
      />

      {!noPhysicalAddress ? (
        <>
          <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            editable={!readOnly}
            placeholder="Street address"
            placeholderTextColor={theme.colors.mutedForeground}
            style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
          />
        </>
      ) : null}

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Website (optional)</Text>
      <TextInput
        value={website}
        onChangeText={setWebsite}
        editable={!readOnly}
        placeholder="https://"
        autoCapitalize="none"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Business logo (optional)</Text>
      <Pressable
        onPress={readOnly ? undefined : () => pickImage('logo')}
        style={[
          styles.logoBox,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.muted },
        ]}>
        {logoPreview ? (
          <Image source={{ uri: logoPreview }} style={styles.logoImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="storefront-outline" size={28} color={theme.colors.mutedForeground} />
            <Text style={{ color: theme.colors.mutedForeground }}>Add logo</Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Cover photo (optional)</Text>
      <Pressable
        onPress={readOnly ? undefined : () => pickImage('cover')}
        style={[
          styles.coverBox,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.muted },
        ]}>
        {coverPreview ? (
          <Image source={{ uri: coverPreview }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={28} color={theme.colors.mutedForeground} />
            <Text style={{ color: theme.colors.mutedForeground }}>Add cover photo</Text>
          </View>
        )}
      </Pressable>

      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 8 }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.primary, marginBottom: 12 }}>{message}</Text> : null}

      {!readOnly ? (
        <View style={styles.actions}>
          <CtaButton label="Save draft" fullWidth={false} compact loading={loading} onPress={saveDraft} />
          <CtaButton label="Submit for review" loading={loading} onPress={submitForReview} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 8 },
  sectionHeading: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: { fontFamily: 'System', fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontFamily: 'System',
  },
  bio: { minHeight: 88, textAlignVertical: 'top' },
  logoBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    width: 120,
    height: 120,
  },
  logoImage: { width: 120, height: 120 },
  coverBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 140,
  },
  coverImage: { width: '100%', height: 160 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  googleCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  googleTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  autoFillBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actions: { gap: 10 },
});
