import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatApiError } from '../../api/formatApiError';
import { fetchMyProfileCards, fetchProfileCardRequests, type ProfileCardRecord } from '../../api/client';
import { LoadingShell, SectionLabel } from '../../components/app';
import { profileCardIcon, visibilityLabel } from '../../profileCards/profileCardMeta';
import { profileCardShareUrl } from '../../profileCards/shareUrl';
import { copyText } from '../../utils/copyText';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function ProfileCardsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const [cards, setCards] = useState<ProfileCardRecord[] | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([fetchMyProfileCards(), fetchProfileCardRequests()])
      .then(([nextCards, requests]) => {
        setCards(nextCards);
        setRequestCount(requests.length);
      })
      .catch((err) => {
        setError(formatApiError(err, 'Could not load your profiles.'));
        setCards([]);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (cards === null && !error) {
    return <LoadingShell label="Loading profiles" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 16 }}>
          Settings
        </Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 8,
        }}>
        Profile cards
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: 20,
        }}>
        Share a professional résumé, a match profile, or anything else. Each card stays private until you choose otherwise.
      </Text>

      {error ? (
        <Text style={{ color: theme.colors.destructive, marginBottom: 12 }}>{error}</Text>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate('ProfileCardRequests')}
        style={[
          styles.linkCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 16 }}>
          Access requests
        </Text>
        <View style={styles.linkRight}>
          {requestCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{requestCount}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
        </View>
      </Pressable>

      <SectionLabel>YOUR PROFILES</SectionLabel>
      {(cards ?? []).length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16 }}>
          You have not created a profile card yet.
        </Text>
      ) : (
        (cards ?? []).map((card) => (
          <View
            key={card.id}
            style={[
              styles.cardRow,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.card,
              },
            ]}>
            <Pressable
              onPress={() => navigation.navigate('EditProfileCard', { cardId: card.id })}
              style={styles.cardMain}>
              <Ionicons name={profileCardIcon(card.type)} size={22} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.cardForeground,
                    fontFamily: theme.typography.sans,
                    fontWeight: '600',
                  }}>
                  {card.title}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }}>
                  {visibilityLabel(card.visibility)}
                  {card.pendingRequestCount ? ` · ${card.pendingRequestCount} pending` : ''}
                </Text>
              </View>
            </Pressable>
            {card.slug ? (
              Platform.OS === 'web' ? (
                <button
                  type="button"
                  onClick={() => {
                    void copyText(profileCardShareUrl(card.slug ?? '')).then((ok) => {
                      if (ok) setCopiedId(card.id);
                    });
                  }}
                  aria-label="Copy link"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 8,
                    cursor: 'pointer',
                    color: copiedId === card.id ? theme.colors.primary : theme.colors.mutedForeground,
                  }}>
                  <Ionicons
                    name={copiedId === card.id ? 'checkmark' : 'copy-outline'}
                    size={18}
                    color={copiedId === card.id ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                </button>
              ) : (
                <Pressable
                  onPress={() => {
                    void copyText(profileCardShareUrl(card.slug ?? '')).then((ok) => {
                      if (ok) setCopiedId(card.id);
                    });
                  }}
                  style={{ padding: 8 }}>
                  <Ionicons
                    name={copiedId === card.id ? 'checkmark' : 'copy-outline'}
                    size={18}
                    color={copiedId === card.id ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                </Pressable>
              )
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
          </View>
        ))
      )}

      <Pressable
        onPress={() => navigation.navigate('AddProfileCard')}
        style={[
          styles.addRow,
          {
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Ionicons name="add" size={20} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 16 }}>
          Add a new profile
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  linkRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginTop: 8,
  },
});
