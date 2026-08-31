import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatApiError } from '../../api/formatApiError';
import {
  fetchUserProfileCards,
  requestProfileCardAccess,
  type ProfileCardSummary,
} from '../../api/client';
import { fetchUserStatuses } from '../../api/client';
import { Avatar, UniversalLoader } from '../../components/app';
import { StatusRing } from '../../components/status/StatusRing';
import { openStatusViewer } from '../../navigation/rootNavigation';
import { statusRingTone } from '../../status/statusLogic';
import { ProfileCardTile } from '../../components/profileCards/ProfileCardTile';
import { useChat } from '../../chat/ChatContext';
import type { ChatsStackParamList, RootTabParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

type Navigation = CompositeNavigationProp<
  NativeStackNavigationProp<ChatsStackParamList, 'ChatInfo'>,
  BottomTabNavigationProp<RootTabParamList>
>;

export function ChatInfoScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<ChatsStackParamList, 'ChatInfo'>>();
  const { theme } = useGochaTheme();
  const chatApi = useChat();
  const chat = chatApi.getChat(route.params.chatId);
  const [cards, setCards] = useState<ProfileCardSummary[] | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [hasStatus, setHasStatus] = useState(false);
  const [statusUnseen, setStatusUnseen] = useState(false);

  const otherUserId = chat?.otherUserId;

  useFocusEffect(
    useCallback(() => {
      if (!otherUserId) {
        setCards([]);
        return;
      }
      setCards(null);
      setError(null);
      fetchUserProfileCards(otherUserId)
        .then((payload) => {
          setCards(payload.cards);
          setUsername(payload.owner.username);
        })
        .catch((err) => {
          setError(formatApiError(err, 'Could not load profiles.'));
          setCards([]);
        });
      fetchUserStatuses(otherUserId)
        .then((payload) => {
          setHasStatus(payload.items.length > 0);
          setStatusUnseen(payload.items.some((item) => !item.viewed));
        })
        .catch(() => {
          setHasStatus(false);
          setStatusUnseen(false);
        });
    }, [otherUserId]),
  );

  if (!chat) return null;

  async function handleCardAction(card: ProfileCardSummary) {
    if (card.canView) {
      navigation.navigate('ProfileCardDetail', { cardId: card.id });
      return;
    }
    if (card.accessStatus === 'pending' || card.visibility !== 'request') {
      return;
    }
    setBusyId(card.id);
    setError(null);
    try {
      const next = await requestProfileCardAccess(card.id);
      setCards((prev) => (prev ?? []).map((item) => (item.id === next.id ? { ...item, ...next } : item)));
    } catch (err) {
      setError(formatApiError(err, 'Could not send that request.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 16 }}>
          Chat
        </Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 16,
        }}>
        Profile
      </Text>

      <View style={styles.hero}>
        <Pressable
          onPress={() => {
            if (hasStatus && otherUserId) {
              openStatusViewer(otherUserId);
            }
          }}
          accessibilityRole="button">
          <StatusRing tone={statusRingTone(hasStatus, statusUnseen)} size={88}>
            <Avatar label={chat.avatarLabel} color={chat.avatarColor} size={88} />
          </StatusRing>
        </Pressable>
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 22,
            fontWeight: '700',
            marginTop: 12,
          }}>
          {chat.name}
        </Text>
        {username ? (
          <Text style={{ color: theme.colors.mutedForeground, marginTop: 4 }}>@{username}</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable onPress={() => navigation.navigate('ChatDetail', { chatId: chat.id })} style={styles.action}>
            <View style={[styles.actionCircle, { borderColor: theme.colors.border }]}>
              <Ionicons name="chatbubble-outline" size={22} color={theme.colors.cardForeground} />
            </View>
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 6 }}>Message</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('CallsTab')} style={styles.action}>
            <View style={[styles.actionCircle, { borderColor: theme.colors.border }]}>
              <Ionicons name="call-outline" size={22} color={theme.colors.cardForeground} />
            </View>
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, marginTop: 6 }}>Call</Text>
          </Pressable>
        </View>
      </View>

      {otherUserId ? (
        <>
          <Text style={[styles.section, { color: theme.colors.mutedForeground }]}>AVAILABLE PROFILES</Text>
          {cards === null ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <UniversalLoader size={0.3} />
            </View>
          ) : cards.length === 0 ? (
            <Text style={{ color: theme.colors.mutedForeground }}>No profiles to show yet.</Text>
          ) : (
            cards.map((card) => (
              <ProfileCardTile
                key={card.id}
                card={card}
                actionLoading={busyId === card.id}
                onPressAction={() => void handleCardAction(card)}
              />
            ))
          )}
          {error ? <Text style={{ color: theme.colors.destructive, marginTop: 8 }}>{error}</Text> : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  hero: { alignItems: 'center', marginBottom: 28 },
  actions: { flexDirection: 'row', gap: 28, marginTop: 18 },
  action: { alignItems: 'center' },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
});
