import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar, SectionLabel } from '../../components/app';
import { BrandBadge } from '../../components/brand';
import {
  attentionItems,
  briefingText,
  conversationBriefs,
} from '../../data/mock';
import { useGochaTheme } from '../../theme';

export function CatchUpScreen() {
  const { theme } = useGochaTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Ionicons name="sparkles" size={22} color={theme.colors.primary} />
        <Text
          style={{
            flex: 1,
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.serif,
            fontSize: 22,
          }}>
          What did I miss?
        </Text>
        <Pressable hitSlop={12}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      <View
        style={[
          styles.briefing,
          {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.radii.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <View style={styles.briefingTitle}>
          <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 17,
              fontWeight: '600',
            }}>
            Your briefing
          </Text>
        </View>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 15,
            lineHeight: 22,
          }}>
          {briefingText}
        </Text>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 12,
            marginTop: 4,
          }}>
          Build 1: summaries via managed AI (OpenAI) until proprietary AI in Build 3.
        </Text>
      </View>

      <SectionLabel>NEEDS YOUR ATTENTION</SectionLabel>
      {attentionItems.map((item) => (
        <View
          key={item.id}
          style={[
            styles.attentionRow,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
            },
          ]}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  item.tone === 'critical'
                    ? theme.colors.destructive
                    : theme.colors.chart5,
              },
            ]}
          />
          <Text
            style={{
              flex: 1,
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
              lineHeight: 20,
            }}>
            {item.text}
          </Text>
        </View>
      ))}

      <SectionLabel>CONVERSATIONS</SectionLabel>
      {conversationBriefs.map((brief) => (
        <View
          key={brief.id}
          style={[
            styles.conversationCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <View style={styles.conversationHeader}>
            <Avatar label={brief.avatarLabel} size={44} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                {brief.name}
              </Text>
              <View style={styles.badgeRow}>
                <BrandBadge label={`${brief.unreadCount} unread`} />
                <BrandBadge label={brief.priority} tone="secondary" />
              </View>
            </View>
          </View>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
              lineHeight: 20,
            }}>
            {brief.summary}
          </Text>
          <View style={styles.plans}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.cardForeground,
                fontFamily: theme.typography.sans,
                fontSize: 14,
              }}>
              Dates & plans
            </Text>
          </View>
          {brief.plans.map((plan) => (
            <Text
              key={plan}
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 14,
              }}>
              • {plan}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  briefing: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  briefingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  conversationCard: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  conversationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  plans: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
});
