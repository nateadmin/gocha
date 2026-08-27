import { ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../../components/app';
import { BrandBadge, CtaButton } from '../../components/brand';
import { discoverableGroups } from '../../data/mock';
import { useGochaTheme } from '../../theme';

export function AroundMeScreen() {
  const { theme } = useGochaTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 26,
        }}>
        Around Me
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 8,
        }}>
        Discover local groups and activities. Discoverable groups accept join requests;
        admins approve or decline. Conversations stay private until you are a member.
      </Text>

      {discoverableGroups.map((group) => (
        <View
          key={group.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <View style={styles.cardHeader}>
            <Avatar label={group.avatarLabel} color={group.avatarColor} size={48} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 17,
                  fontWeight: '600',
                }}>
                {group.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 13,
                }}>
                {group.memberCount} members
              </Text>
            </View>
            <BrandBadge label="Discoverable" tone="secondary" />
          </View>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
              lineHeight: 20,
            }}>
            {group.description}
          </Text>
          <View style={styles.tagsRow}>
            <View style={styles.tags}>
              {group.interestTags.map((tag) => (
                <BrandBadge key={tag} label={tag} />
              ))}
            </View>
            <CtaButton label="Request to join" fullWidth={false} compact />
          </View>
        </View>
      ))}

      <View
        style={[
          styles.privateNote,
          {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.radii.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <Ionicons name="lock-closed-outline" size={18} color={theme.colors.primary} />
        <Text
          style={{
            flex: 1,
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 13,
            lineHeight: 18,
          }}>
          Private groups are hidden from Around Me. Join only through a direct invitation
          from the group admin.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  privateNote: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
});
