import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { SectionLabel, SettingsToggleRow } from '../../components/app';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';
import { brandLogoSource } from '../../branding/logo';
import { useAuth } from '../../context/AuthContext';
import { useGochaTheme } from '../../theme';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme, mode, setMode } = useGochaTheme();
  const { user, signOut } = useAuth();
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
        <Image
          accessibilityLabel="Profile avatar"
          source={user?.avatarUrl ? { uri: user.avatarUrl } : brandLogoSource}
          style={[
            styles.profileAvatar,
            {
              borderRadius: theme.radii.avatar,
              backgroundColor: theme.colors.muted,
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 18,
              fontWeight: '600',
            }}>
            {user?.chatDisplayName ?? user?.displayName ?? 'Gocha user'}
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
            }}>
            {user?.email ?? user?.phone ?? ''}
          </Text>
          {user?.effectiveVerificationStatus === 'verified' ? (
            <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 13, marginTop: 4 }}>
              Verified
            </Text>
          ) : null}
          {user?.status ? (
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 14,
                marginTop: 4,
              }}>
              {user.status}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
      </Pressable>

      <SectionLabel>ACCOUNT</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Pressable onPress={() => navigation.navigate('Accounts')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Accounts
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('ProfileMode')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Chat profile ({user?.profileMode ?? 'personal'})
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('UsernameSettings')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Username {user?.username ? `(@${user.username})` : ''}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('MyBusinessListings')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            My business listings
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('BusinessListingForm')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            List a new business
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        {user?.isAdmin ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Pressable onPress={() => navigation.navigate('AdminReview')} style={styles.linkRow}>
              <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
                Admin review queue
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          </>
        ) : null}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => signOut()} style={styles.signOutRow}>
          <Text
            style={{
              color: theme.colors.destructive,
              fontFamily: theme.typography.sans,
              fontSize: theme.typography.body,
            }}>
            Sign out
          </Text>
        </Pressable>
      </View>

      <SectionLabel>CHATS</SectionLabel>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Pressable
          onPress={() => navigation.navigate('ChatLabelsSettings')}
          style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Labels, lists & swipe gestures
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('HiddenChats')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Hidden chats
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('BlockedChats')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Blocked contacts
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('ChatListsSettings')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            Manage chat lists
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
      </View>

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
      <SectionLabel>GOCHA COLLECTIVE (BUILD 3)</SectionLabel>
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

      <SectionLabel>APPEARANCE</SectionLabel>
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
          icon={mode === 'light' ? 'sunny-outline' : 'moon-outline'}
          label="Light mode"
          value={mode === 'light'}
          onValueChange={(enabled) => setMode(enabled ? 'light' : 'dark')}
        />
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
    resizeMode: 'contain',
  },
  card: {
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  signOutRow: {
    paddingVertical: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
