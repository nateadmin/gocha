import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { getBusinessById } from '../../data/mock';
import { neonShadowStyle, useGochaTheme, type GochaTheme } from '../../theme';
import type { DiscoverStackParamList } from '../../navigation/types';

export function BusinessDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<DiscoverStackParamList, 'BusinessDetail'>>();
  const { theme } = useGochaTheme();
  const business = getBusinessById(route.params.businessId);

  if (!business) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 17,
            fontWeight: '600',
          }}>
          {business.name}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.hero,
            { backgroundColor: business.imageColor, borderRadius: theme.radii.card },
          ]}>
          <Text
            style={{
              color: theme.colors.primaryForeground,
              fontFamily: theme.typography.serif,
              fontSize: 28,
            }}>
            {business.name}
          </Text>
          <Text
            style={{
              color: theme.colors.primaryForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
            }}>
            ★ {business.rating} · {business.reviewCount} reviews · {business.priceLevel}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Meta icon="time-outline" label={business.etaLabel} theme={theme} />
          <Meta icon="car-outline" label={business.feeLabel} theme={theme} />
          <Meta icon="location-outline" label={business.address} theme={theme} />
        </View>

        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 14,
            marginBottom: 16,
          }}>
          {business.description}
        </Text>

        {business.menu.map((section) => (
          <View key={section.id} style={styles.menuSection}>
            <Text
              style={{
                color: theme.colors.secondary,
                fontFamily: theme.typography.sans,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8,
              }}>
              {section.title}
            </Text>
            {section.items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.card,
                    backgroundColor: theme.colors.card,
                  },
                ]}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.cardForeground,
                      fontFamily: theme.typography.sans,
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.mutedForeground,
                      fontFamily: theme.typography.sans,
                      fontSize: 13,
                    }}>
                    {item.description}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.cardForeground,
                      fontFamily: theme.typography.sans,
                      fontSize: 15,
                      fontWeight: '600',
                      marginTop: 4,
                    }}>
                    {item.price}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.radii.pill,
                    },
                    neonShadowStyle(theme),
                  ]}>
                  <Ionicons name="add" size={22} color={theme.colors.primaryForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Meta({
  icon,
  label,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: GochaTheme;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 12,
        }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    height: 160,
    padding: 16,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuSection: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
