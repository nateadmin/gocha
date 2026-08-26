import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BrandButton } from '../../components/brand/BrandButton';
import {
  approveBusinessListing,
  fetchPendingBusinessListings,
  rejectBusinessListing,
  type OwnerBusinessListing,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function AdminReviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user } = useAuth();
  const [listings, setListings] = useState<OwnerBusinessListing[]>([]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchPendingBusinessListings().then(setListings).catch(() => setListings([]));
    }
  }, [user?.isAdmin]);

  if (!user?.isAdmin) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.mutedForeground }}>Admin access required.</Text>
      </View>
    );
  }

  async function approve(id: number) {
    const updated = await approveBusinessListing(id);
    setListings((prev) => prev.filter((entry) => entry.id !== updated.id));
  }

  async function reject(id: number) {
    const updated = await rejectBusinessListing(id, 'Needs more detail before approval.');
    setListings((prev) => prev.filter((entry) => entry.id !== updated.id));
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Settings</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        Admin review
      </Text>

      {listings.length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans }}>
          No pending business listings.
        </Text>
      ) : (
        listings.map((listing) => (
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
            <Text style={{ color: theme.colors.cardForeground, fontWeight: '600', fontFamily: theme.typography.sans }}>
              {listing.name}
            </Text>
            <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans, marginTop: 4 }}>
              {listing.description ?? 'No description'}
            </Text>
            <View style={styles.actions}>
              <BrandButton label="Approve" onPress={() => approve(listing.id)} />
              <BrandButton label="Reject" variant="outline" onPress={() => reject(listing.id)} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 16 },
  card: { borderWidth: 1, padding: 16, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
