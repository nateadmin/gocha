import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { SectionLabel, SettingsToggleRow } from '../../components/app';
import { userProfile } from '../../data/mock';
import { useGochaTheme } from '../../theme';

export function SettingsScreen() {
  const { theme } = useGochaTheme();
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [aiSummaries, setAiSummaries] = useState(true);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 12,
        }}>
        Settings
      </Text>

      <Pressable
        style={[
          styles.profileCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <View
          style={[
            styles.profileAvatar,
            {
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radii.avatar,
            },
          ]}>
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.typography.sans,
              fontSize: 22,
              fontWeight: '600',
            }}>
            {userProfile.avatarLabel}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 18,
              fontWeight: '600',
            }}>
            {userProfile.name}
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
            }}>
            {userProfile.email}
          </Text>
          <Text
            style={{
              color: theme.colors.secondary,
              fontFamily: theme.typography.sans,
              fontSize: 14,
              marginTop: 4,
            }}>
            Edit profile
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
      </Pressable>

      <SectionLabel>PRIVACY</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <SettingsToggleRow
          icon="shield-checkmark-outline"
          label="Read receipts"
          value={readReceipts}
          onValueChange={setReadReceipts}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <SettingsToggleRow
          icon="person-outline"
          label="Last seen"
          value={lastSeen}
          onValueChange={setLastSeen}
        />
      </View>

      <SectionLabel>NOTIFICATIONS</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <SettingsToggleRow
          icon="notifications-outline"
          label="Push notifications"
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <SettingsToggleRow
          icon="chatbox-outline"
          label="Show message preview"
          value={messagePreview}
          onValueChange={setMessagePreview}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <SettingsToggleRow
          icon="volume-medium-outline"
          label="Notification sound"
          value={notificationSound}
          onValueChange={setNotificationSound}
        />
      </View>

      <SectionLabel>AI SETTINGS</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <SettingsToggleRow
          icon="sparkles"
          label="AI chat summaries"
          value={aiSummaries}
          onValueChange={setAiSummaries}
        />
      </View>
      <SectionLabel>GOTCHA COLLECTIVE (BUILD 3)</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 14,
            lineHeight: 20,
          }}>
          Collective membership, negotiated discounts, and app linkage ship in Build 3.
          Phase 2 may start as a standalone website first.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
