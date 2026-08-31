import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ProfileAvatar, SectionLabel, SettingsToggleRow } from '../../components/app';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootTabParamList, SettingsStackParamList } from '../../navigation/types';
import { useAccounts } from '../../context/AccountsContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { languageLabel } from '../../i18n/languages';
import { useGochaTheme } from '../../theme';

type SettingsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { theme, mode, setMode } = useGochaTheme();
  const { accounts } = useAccounts();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [aiSummaries, setAiSummaries] = useState(true);

  async function handleSignOut() {
    const result = await signOut();
    if (result === 'switched') {
      navigation.navigate('ChatsTab', { screen: 'ChatsList' });
    }
  }

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
        {t('settings.title')}
      </Text>

      <Pressable
        onPress={() => navigation.navigate('ProfileSettings')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.profileCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
            opacity: pressed ? 0.92 : 1,
          },
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null,
        ]}>
        <ProfileAvatar
          avatarUrl={user?.avatarUrl}
          displayName={user?.chatDisplayName ?? user?.displayName}
          email={user?.email}
          userId={user?.id}
          size={56}
          style={styles.profileAvatar}
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
              {t('settings.verified')}
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

      <SectionLabel>{t('settings.account')}</SectionLabel>
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
            {t('settings.accounts')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('ProfileMode')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            {t('settings.chatProfile')} ({user?.profileMode ?? 'personal'})
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('UsernameSettings')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            {t('settings.username')} {user?.username ? `(@${user.username})` : ''}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('LanguageSettings')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            {t('settings.language')} ({languageLabel(user?.language)})
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('ProfileCards')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            {t('settings.profileCards')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('MyBusinessListings')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            {t('settings.myListings')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Pressable onPress={() => navigation.navigate('BusinessListingForm')} style={styles.linkRow}>
          <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
            {t('settings.listBusiness')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        {user?.isAdmin ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Pressable onPress={() => navigation.navigate('AdminReview')} style={styles.linkRow}>
              <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans }}>
                {t('settings.adminReview')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          </>
        ) : null}
      </View>

      <SectionLabel>{t('settings.chats')}</SectionLabel>
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

      <SectionLabel>{t('settings.privacy')}</SectionLabel>
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

      <SectionLabel>{t('settings.notifications')}</SectionLabel>
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

      <SectionLabel>{t('settings.ai')}</SectionLabel>
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

      <SectionLabel>{t('settings.appearance')}</SectionLabel>
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
          label={t('settings.lightMode')}
          value={mode === 'light'}
          onValueChange={(enabled) => setMode(enabled ? 'light' : 'dark')}
        />
      </View>

      <Pressable
        onPress={handleSignOut}
        style={[
          styles.signOutCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Text
          style={{
            color: theme.colors.destructive,
            fontFamily: theme.typography.sans,
            fontSize: theme.typography.body,
            textAlign: 'center',
          }}>
          {accounts.length > 1 ? t('settings.signOutThis') : t('settings.signOut')}
        </Text>
      </Pressable>
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
  },
  card: {
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  signOutCard: {
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
