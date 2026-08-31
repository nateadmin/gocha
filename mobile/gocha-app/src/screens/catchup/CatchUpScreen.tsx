import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import { fetchCatchUp, type CatchUpPayload } from '../../api/client';
import { mergeCatchUp } from '../../catchup/mergeCatchUp';
import { LoadingShell, ProfileAvatar, SectionLabel } from '../../components/app';
import { BrandBadge } from '../../components/brand';
import { useAuth } from '../../context/AuthContext';
import type { RootTabParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

const POLL_MS = 60_000;
const catchUpCache = new Map<number, CatchUpPayload>();

export function CatchUpScreen() {
  const { theme } = useGochaTheme();
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const userId = user?.id ?? null;
  const [data, setData] = useState<CatchUpPayload | null>(() =>
    userId != null ? catchUpCache.get(userId) ?? null : null,
  );
  const [loading, setLoading] = useState(data === null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const backoffRef = useRef(POLL_MS);
  const dataRef = useRef(data);
  dataRef.current = data;

  const load = useCallback(
    async (mode: 'initial' | 'poll') => {
      if (userId == null || inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      if (mode === 'initial' && dataRef.current === null) {
        setLoading(true);
      }
      try {
        const next = await fetchCatchUp();
        const merged = mergeCatchUp(dataRef.current, next);
        catchUpCache.set(userId, merged);
        setData(merged);
        setError(null);
        backoffRef.current = POLL_MS;
      } catch {
        if (dataRef.current === null) {
          setError('Catch Up is unavailable right now.');
        }
        backoffRef.current = Math.min(backoffRef.current * 2, 240_000);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    const cached = userId != null ? catchUpCache.get(userId) ?? null : null;
    setData(cached);
    dataRef.current = cached;
    setError(null);
    setLoading(cached === null && userId != null);
    if (userId != null) {
      void load('initial');
    }
  }, [userId, load]);

  useFocusEffect(
    useCallback(() => {
      if (userId == null) {
        return undefined;
      }
      void load(dataRef.current ? 'poll' : 'initial');
      let timer: ReturnType<typeof setInterval> | null = null;
      const startTimer = () => {
        if (timer) {
          clearInterval(timer);
        }
        timer = setInterval(() => {
          if (isPageVisible()) {
            void load('poll');
          }
        }, backoffRef.current);
      };
      startTimer();
      const onAppState = (state: AppStateStatus) => {
        if (state === 'active') {
          void load('poll');
          startTimer();
        }
      };
      const appSub = AppState.addEventListener('change', onAppState);
      const onVisibility = () => {
        if (isPageVisible()) {
          void load('poll');
        }
      };
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibility);
      }
      return () => {
        if (timer) {
          clearInterval(timer);
        }
        appSub.remove();
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisibility);
        }
      };
    }, [load, userId]),
  );

  const openConversation = (conversationId: number) => {
    navigation.navigate('ChatsTab', {
      screen: 'ChatDetail',
      params: { chatId: String(conversationId) },
    });
  };

  if (loading && data === null) {
    return <LoadingShell />;
  }

  if (error && data === null) {
    return (
      <View style={[styles.emptyShell, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 15 }}>
          {error}
        </Text>
      </View>
    );
  }

  const payload = data ?? {
    briefing: '',
    generatedAt: null,
    attention: [],
    conversations: [],
  };
  const empty = payload.conversations.length === 0 && payload.attention.length === 0;

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
        <Pressable hitSlop={12} onPress={() => void load('poll')}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      {payload.briefing ? (
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
            {payload.briefing}
          </Text>
        </View>
      ) : null}

      {payload.attention.length > 0 ? (
        <>
          <SectionLabel>NEEDS YOUR ATTENTION</SectionLabel>
          {payload.attention.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openConversation(item.conversationId)}
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
                      item.tone === 'critical' ? theme.colors.destructive : theme.colors.chart5,
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
            </Pressable>
          ))}
        </>
      ) : null}

      <SectionLabel>CONVERSATIONS</SectionLabel>
      {empty ? (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 14,
            lineHeight: 20,
          }}>
          No conversation summaries yet.
        </Text>
      ) : null}
      {payload.conversations.map((brief) => (
        <Pressable
          key={brief.id}
          onPress={() => openConversation(brief.id)}
          style={[
            styles.conversationCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <View style={styles.conversationHeader}>
            <ProfileAvatar
              avatarUrl={brief.avatarUrl}
              displayName={brief.name}
              size={44}
              accessibilityLabel={brief.name}
            />
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
          {brief.plans.length > 0 ? (
            <>
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
            </>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

function isPageVisible(): boolean {
  if (typeof document !== 'undefined') {
    return document.visibilityState === 'visible';
  }
  return AppState.currentState === 'active';
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  emptyShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
