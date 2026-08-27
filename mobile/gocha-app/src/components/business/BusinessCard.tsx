import { Pressable, View, Text, StyleSheet } from 'react-native';

import type { Business } from '../../data/mock';
import { useGochaTheme } from '../../theme';

type Props = {
  business: Business;
  onPress: () => void;
};

export function BusinessCard({ business, onPress }: Props) {
  const { theme } = useGochaTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radii.card,
          backgroundColor: theme.colors.card,
        },
      ]}>
      <View
        style={[
          styles.thumb,
          { backgroundColor: business.imageColor, borderRadius: theme.radii.card },
        ]}
      />
      <View style={styles.body}>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 17,
            fontWeight: '600',
          }}>
          {business.name}
        </Text>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 13,
          }}>
          ★ {business.rating} ({business.reviewCount}) · {business.priceLevel}
        </Text>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 13,
          }}>
          {business.etaLabel} · {business.feeLabel}
        </Text>
        <View style={styles.tags}>
          {business.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                {
                  backgroundColor: theme.colors.muted,
                  borderRadius: theme.radii.pill,
                },
              ]}>
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.typography.sans,
                  fontSize: 12,
                }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  thumb: {
    width: 72,
    height: 72,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
