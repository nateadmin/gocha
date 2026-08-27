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
  type BusinessIndustry,
  type OwnerBusinessListing,
} from '../../api/client';
import { IndustryPicker } from '../../components/business/IndustryPicker';
import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand/CtaButton';
import type { DiscoverStackParamList, SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

type FormRoute =
  | RouteProp<DiscoverStackParamList, 'BusinessListingForm'>
  | RouteProp<SettingsStackParamList, 'BusinessListingForm'>;

function buildPayload(
  name: string,
  category: string,
  address: string,
  noPhysicalAddress: boolean,
  website: string,
  googleUrl: string,
  googlePlaceId: string | null,
) {
  return {
    name: name.trim(),
    category: category || undefined,
    address: noPhysicalAddress ? undefined : address.trim() || undefined,
    no_physical_address: noPhysicalAddress,
    website: website.trim() || undefined,
    google_business_url: googleUrl.trim() || undefined,
    google_place_id: googlePlaceId || undefined,
  };
}

export function BusinessListingFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>();
  const route = useRoute<FormRoute>();
  const listingId = route.params?.listingId;
  const { theme } = useGochaTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [noPhysicalAddress, setNoPhysicalAddress] = useState(false);
  const [website, setWebsite] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCover, setPendingCover] = useState<Blob | null>(null);
  const [pendingCoverName, setPendingCoverName] = useState('cover.jpg');
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
    setAddress(match.address ?? '');
    setNoPhysicalAddress(match.noPhysicalAddress);
    setWebsite(match.website ?? '');
    setGoogleUrl(match.googleBusinessUrl ?? '');
    setGooglePlaceId(match.googlePlaceId);
    setCoverPreview(match.coverPhotoUrl);
  }, [listingId]);

  useEffect(() => {
    fetchBusinessIndustries()
      .then(setIndustries)
      .catch(() => setIndustries([]));
    if (listingId) {
      loadListing().catch(() => setError('Could not load listing.'));
    }
  }, [listingId, loadListing]);

  function pickCover() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setPendingCover(file);
      setPendingCoverName(file.name);
      setCoverPreview(URL.createObjectURL(file));
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
      if (imported.address) setAddress(imported.address);
      setNoPhysicalAddress(imported.noPhysicalAddress);
      if (imported.website) setWebsite(imported.website);
      setGoogleUrl(imported.googleBusinessUrl);
      setGooglePlaceId(imported.googlePlaceId);
      setMessage('Auto-filled from Google listing.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not read that Google link.');
    } finally {
      setImporting(false);
    }
  }

  async function persistCover(id: number) {
    if (!pendingCover) return;
    await uploadBusinessCover(id, pendingCover, pendingCoverName);
    setPendingCover(null);
  }

  async function saveDraft() {
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload(name, category, address, noPhysicalAddress, website, googleUrl, googlePlaceId);
      let listing: OwnerBusinessListing;
      if (listingId && existing) {
        listing = await saveBusinessListingDraft(listingId, payload);
      } else {
        listing = await submitBusinessListing({ ...payload, submit: false });
      }
      await persistCover(listing.id);
      setExisting(listing);
      setMessage('Draft saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save draft.');
    } finally {
      setLoading(false);
    }
  }

  async function submitForReview() {
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload(name, category, address, noPhysicalAddress, website, googleUrl, googlePlaceId);
      let listing: OwnerBusinessListing;
      if (listingId && existing) {
        await updateBusinessListing(listingId, payload);
        listing = await submitBusinessListingForReview(listingId);
      } else {
        listing = await submitBusinessListing({ ...payload, submit: true });
      }
      await persistCover(listing.id);
      setMessage('Submitted for review. We will notify you when it is approved.');
      setExisting(listing);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit listing.');
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
        Add your business details or paste a Google listing link to auto-fill. Listings go live after review.
      </Text>

      {readOnly ? (
        <Text style={{ color: theme.colors.primary, marginBottom: 12, fontFamily: theme.typography.sans }}>
          {existing?.status === 'approved'
            ? 'This listing is live. Unpublish it from My listings to edit.'
            : 'This listing is pending review and cannot be edited.'}
        </Text>
      ) : null}

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Business name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        editable={!readOnly}
        placeholder="Business name"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
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

      <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Cover photo (optional)</Text>
      <Pressable
        onPress={readOnly ? undefined : pickCover}
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

      <View
        style={[
          styles.googleCard,
          { backgroundColor: theme.colors.muted, borderColor: theme.colors.border },
        ]}>
        <View style={styles.googleTitle}>
          <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.cardForeground, fontWeight: '600' }}>Google Business link</Text>
        </View>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
          Paste your Google Maps or Google Business profile link and auto-fill details.
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
  label: { fontFamily: 'System', fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontFamily: 'System',
  },
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
    marginBottom: 12,
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
