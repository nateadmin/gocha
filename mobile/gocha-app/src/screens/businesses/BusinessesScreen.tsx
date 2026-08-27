import { useMemo, useState } from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BusinessCard } from '../../components/business';
import { CtaButton } from '../../components/brand';
import { businessCategories, businesses } from '../../data/mock';
import { useGochaTheme } from '../../theme';
import type { DiscoverStackParamList } from '../../navigation/types';

type Props = {
  /** When true, hides the screen title row (used inside Discover hub). */
  embedded?: boolean;
};

export function BusinessesScreen({ embedded = false }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>();
  const { theme } = useGochaTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchesCategory = category === 'all' || b.category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.tags.some((t) => t.includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {!embedded ? (
        <View style={styles.header}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.serif,
              fontSize: 28,
            }}>
            Businesses
          </Text>
          <Pressable
            style={[
              styles.locationPill,
              {
                backgroundColor: theme.colors.muted,
                borderRadius: theme.radii.pill,
              },
            ]}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
              }}>
              Current Location
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.listBusinessCta}>
          <CtaButton label="List your business" onPress={() => {}} />
        </View>

        {embedded ? (
          <Pressable
            style={[
              styles.locationPill,
              styles.embeddedLocation,
              {
                backgroundColor: theme.colors.muted,
                borderRadius: theme.radii.pill,
              },
            ]}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
              }}>
              Current Location
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
          </Pressable>
        ) : null}
        <View
          style={[
            styles.search,
            {
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radii.pill,
            },
          ]}>
          <Ionicons name="search" size={18} color={theme.colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurants, stores, services..."
            placeholderTextColor={theme.colors.mutedForeground}
            style={{
              flex: 1,
              fontFamily: theme.typography.sans,
              color: theme.colors.cardForeground,
              fontSize: 15,
            }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categories}>
            {businessCategories.map((cat) => {
              const active = cat.id === category;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.card,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.pill,
                    },
                  ]}>
                  <Text
                    style={{
                      color: active
                        ? theme.colors.primaryForeground
                        : theme.colors.cardForeground,
                      fontFamily: theme.typography.sans,
                      fontSize: 13,
                    }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {filtered.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onPress={() =>
              navigation.navigate('BusinessDetail', { businessId: business.id })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  embeddedLocation: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  listBusinessCta: {
    marginBottom: 16,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    marginBottom: 12,
  },
  categories: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
