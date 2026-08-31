import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ApiError,
  deleteBusinessListing,
  fetchMyBusinessListings,
  submitBusinessListingForReview,
  syncBusinessGoogleReviews,
  unpublishBusinessListing,
  type OwnerBusinessListing,
} from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { listingsForTab, pickListingsTab, type ListingsTabId } from '../../business/listingsTabs';
import { industryLabel } from '../../data/businessIndustries';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

type TabId = ListingsTabId;

function statusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Live';
    case 'pending_review':
      return 'Pending review';
    case 'draft':
      return 'Draft';
    case 'unpublished':
      return 'Unpublished';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export function MyBusinessListingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const route = useRoute<RouteProp<SettingsStackParamList, 'MyBusinessListings'>>();
  const { theme } = useGochaTheme();
  const [tab, setTab] = useState<TabId | null>(route.params?.tab ?? null);
  const [listings, setListings] = useState<OwnerBusinessListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setListings(await fetchMyBusinessListings());
    } catch (err) {
      setError(formatApiError(err, 'Could not load your listings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (tab !== null || loading) {
      return;
    }
    setTab(pickListingsTab(listings));
  }, [listings, loading, tab]);

  const activeTab = tab ?? 'drafts';
  const visible = useMemo(() => listingsForTab(listings, activeTab), [listings, activeTab]);

  async function runAction(id: number, action: () => Promise<void>) {
    setActionId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setActionId(null);
    }
  }

  function openMaps(address: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'live', label: 'Live' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'pending', label: 'Pending' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Settings</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        My business listings
      </Text>

      <View style={styles.tabRow}>
        {tabs.map((item) => {
          const active = activeTab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Text
                style={{
                  color: active ? theme.colors.primaryForeground : theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 13,
                }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => navigation.navigate('BusinessListingForm')}
        style={[styles.addRow, { borderColor: theme.colors.primary }]}>
        <Ionicons name="add" size={20} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Add listing</Text>
      </Pressable>

      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 8 }}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : visible.length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans }}>
          No listings in this tab yet.
        </Text>
      ) : (
        visible.map((listing) => {
          const busy = actionId === listing.id;
          const canEdit =
            listing.status !== 'pending_review' && listing.status !== 'approved';
          const canRepublish =
            ['draft', 'unpublished', 'rejected'].includes(listing.status);
          const canUnpublish = listing.status === 'approved';
          const canNavigate = listing.address && !listing.noPhysicalAddress;

          return (
            <View
              key={listing.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.card,
                },
              ]}>
              {listing.coverPhotoUrl ? (
                <Image source={{ uri: listing.coverPhotoUrl }} style={styles.cover} />
              ) : null}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  {listing.logoPhotoUrl ? (
                    <Image source={{ uri: listing.logoPhotoUrl }} style={styles.logo} />
                  ) : null}
                  <Text
                    style={{
                      color: theme.colors.cardForeground,
                      fontFamily: theme.typography.sans,
                      fontSize: 17,
                      fontWeight: '600',
                      flex: 1,
                    }}>
                    {listing.name}
                  </Text>
                  <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{statusLabel(listing.status)}</Text>
                </View>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>
                  {industryLabel(listing.category)}
                </Text>
                {listing.rejectionReason ? (
                  <Text style={{ color: theme.colors.destructive, fontSize: 13, marginTop: 6 }}>
                    {listing.rejectionReason}
                  </Text>
                ) : null}
                {listing.googleReviews.length > 0 ? (
                  <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
                    {listing.googleReviews.length} Google review(s) synced
                  </Text>
                ) : null}

                <View style={styles.actionRow}>
                  {canEdit ? (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('BusinessListingForm', { listingId: listing.id })
                      }>
                      <Text style={{ color: theme.colors.primary }}>Edit</Text>
                    </Pressable>
                  ) : null}
                  {canRepublish ? (
                    <Pressable
                      disabled={busy}
                      onPress={() =>
                        runAction(listing.id, () => submitBusinessListingForReview(listing.id))
                      }>
                      <Text style={{ color: theme.colors.primary }}>
                        {listing.status === 'rejected' ? 'Republish' : 'Submit for review'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {canUnpublish ? (
                    <Pressable
                      disabled={busy}
                      onPress={() => runAction(listing.id, () => unpublishBusinessListing(listing.id))}>
                      <Text style={{ color: theme.colors.primary }}>Unpublish</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    disabled={busy}
                    onPress={() =>
                      runAction(listing.id, () => syncBusinessGoogleReviews(listing.id))
                    }>
                    <Text style={{ color: theme.colors.primary }}>Pull Google reviews</Text>
                  </Pressable>
                  {canNavigate ? (
                    <Pressable onPress={() => openMaps(listing.address!)}>
                      <Text style={{ color: theme.colors.primary }}>Navigate</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    disabled={busy}
                    onPress={() => runAction(listing.id, () => deleteBusinessListing(listing.id))}>
                    <Text style={{ color: theme.colors.destructive }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 120 },
  logo: { width: 36, height: 36, borderRadius: 8 },
  cardBody: { padding: 12, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
});
