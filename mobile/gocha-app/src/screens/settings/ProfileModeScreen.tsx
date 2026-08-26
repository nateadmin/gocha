import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BrandButton } from '../../components/brand/BrandButton';
import { CtaButton } from '../../components/brand/CtaButton';
import { SectionLabel } from '../../components/app';
import {
  ApiError,
  fetchMyBusinessListings,
  updateProfileMode,
  type OwnerBusinessListing,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function ProfileModeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user, refresh } = useAuth();
  const [listings, setListings] = useState<OwnerBusinessListing[]>([]);
  const [mode, setMode] = useState<'personal' | 'business'>(user?.profileMode ?? 'personal');
  const [businessName, setBusinessName] = useState(user?.businessChatName ?? '');
  const [website, setWebsite] = useState(user?.businessChatWebsite ?? '');
  const [listingId, setListingId] = useState<number | null>(user?.activeBusinessListingId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBusinessListings()
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      await updateProfileMode({
        profileMode: mode,
        businessChatName: mode === 'business' ? businessName : undefined,
        businessChatWebsite: mode === 'business' ? website : undefined,
        activeBusinessListingId: mode === 'business' ? listingId : null,
      });
      await refresh();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update profile mode.');
    } finally {
      setLoading(false);
    }
  }

  const approvedListings = listings.filter((entry) => entry.status === 'approved');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Settings</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        Chat profile
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16, fontFamily: theme.typography.sans }}>
        Use personal or business identity in chats. Verified business listings override personal verification.
      </Text>

      <SectionLabel>MODE</SectionLabel>
      <View style={styles.modeRow}>
        <BrandButton
          label="Personal"
          variant={mode === 'personal' ? 'primary' : 'outline'}
          onPress={() => setMode('personal')}
        />
        <BrandButton
          label="Business"
          variant={mode === 'business' ? 'primary' : 'outline'}
          onPress={() => setMode('business')}
        />
      </View>

      {mode === 'business' ? (
        <>
          <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Business display name</Text>
          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Business name in chats"
            placeholderTextColor={theme.colors.mutedForeground}
            style={[
              styles.input,
              {
                color: theme.colors.cardForeground,
                borderColor: theme.colors.border,
                fontFamily: theme.typography.sans,
              },
            ]}
          />
          <Text style={[styles.label, { color: theme.colors.mutedForeground }]}>Website</Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.mutedForeground}
            style={[
              styles.input,
              {
                color: theme.colors.cardForeground,
                borderColor: theme.colors.border,
                fontFamily: theme.typography.sans,
              },
            ]}
          />
          <SectionLabel>LINKED LISTING</SectionLabel>
          {approvedListings.map((listing) => (
            <Pressable
              key={listing.id}
              onPress={() => setListingId(listing.id)}
              style={[styles.listingRow, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
                {listing.name}
              </Text>
              {listingId === listing.id ? (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          ))}
        </>
      ) : null}

      {error ? <Text style={{ color: theme.colors.destructive }}>{error}</Text> : null}
      <CtaButton label="Save" loading={loading} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 8 },
  modeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  listingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
