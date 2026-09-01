import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  deleteStatus,
  fetchStatusViewers,
  fetchUserStatuses,
  markStatusViewed,
  type StatusItemRecord,
  type StatusViewerRecord,
} from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { ConfirmDialog, ProfileAvatar, UniversalLoader } from '../../components/app';
import { StatusVideo } from '../../components/status/StatusVideo';
import { useChat } from '../../chat/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import type { AppStackParamList } from '../../navigation/types';
import {
  isStatusSwipeUp,
  isStatusTap,
  nextAuthorIndex,
  nextStatusIndex,
  previousAuthorIndex,
  previousStatusIndex,
  shouldAdvanceStatus,
  statusDurationMs,
  statusProgressRatio,
  tapSide,
  tickStatusElapsed,
} from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';

type Route = RouteProp<AppStackParamList, 'StatusViewer'>;

export function StatusViewerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { startDirectMessage, sendTextMessage } = useChat();
  const playlist = route.params.userIds?.length ? route.params.userIds : [route.params.userId];
  const [authorUserId, setAuthorUserId] = useState(route.params.userId);
  const [items, setItems] = useState<StatusItemRecord[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<StatusViewerRecord[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const holdingRef = useRef(false);
  const pausedRef = useRef(false);
  const pressX = useRef(0);
  const pressY = useRef(0);
  const downAt = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const itemsRef = useRef<StatusItemRecord[]>([]);
  const authorRef = useRef(authorUserId);
  const item = items[index];
  const isOwn = user?.id === authorUserId;
  indexRef.current = index;
  itemsRef.current = items;
  authorRef.current = authorUserId;
  pausedRef.current = paused || replyOpen || Boolean(viewers);

  const close = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const loadAuthor = useCallback(
    (userId: number, startAt: 'first' | 'last' | number = 'first') => {
      setLoading(true);
      setError(null);
      setReplyOpen(false);
      setViewers(null);
      fetchUserStatuses(userId)
        .then((payload) => {
          setAuthorUserId(userId);
          setDisplayName(payload.displayName);
          setAvatarUrl(payload.avatarUrl);
          setItems(payload.items);
          const start =
            startAt === 'last'
              ? Math.max(0, payload.items.length - 1)
              : typeof startAt === 'number'
                ? payload.items.findIndex((entry) => entry.id === startAt)
                : 0;
          setIndex(start >= 0 ? start : 0);
          setProgress(0);
          setLoading(false);
          if (payload.items.length === 0 && user?.id === userId) {
            navigation.replace('StatusComposer', {});
            return;
          }
          if (payload.items.length === 0) {
            close();
          }
        })
        .catch((err) => {
          setLoading(false);
          setError(formatApiError(err, t('status.loadFailed')));
        });
    },
    [close, navigation, t, user?.id],
  );

  const goNext = useCallback(() => {
    const next = nextStatusIndex(indexRef.current, itemsRef.current.length);
    if (next != null) {
      setIndex(next);
      setProgress(0);
      setViewers(null);
      return;
    }
    const authorPos = playlist.indexOf(authorRef.current);
    const nextAuthor = nextAuthorIndex(authorPos < 0 ? 0 : authorPos, playlist.length);
    if (nextAuthor == null) {
      close();
      return;
    }
    loadAuthor(playlist[nextAuthor] as number, 'first');
  }, [close, loadAuthor, playlist]);

  const goPrev = useCallback(() => {
    if (indexRef.current > 0) {
      setIndex(previousStatusIndex(indexRef.current));
      setProgress(0);
      setViewers(null);
      return;
    }
    const authorPos = playlist.indexOf(authorRef.current);
    if (authorPos <= 0) {
      setIndex(0);
      setProgress(0);
      return;
    }
    loadAuthor(playlist[previousAuthorIndex(authorPos)] as number, 'last');
  }, [loadAuthor, playlist]);

  useFocusEffect(
    useCallback(() => {
      const startId = route.params.startItemId;
      loadAuthor(route.params.userId, startId ?? 'first');
    }, [loadAuthor, route.params.startItemId, route.params.userId]),
  );

  useEffect(() => {
    if (!item || isOwn || item.viewed) {
      return;
    }
    void markStatusViewed(item.id).catch(() => undefined);
  }, [isOwn, item]);

  useEffect(() => {
    elapsedRef.current = 0;
    lastTickRef.current = null;
    setProgress(0);
  }, [item?.id]);

  useEffect(() => {
    if (!item) {
      lastTickRef.current = null;
      return;
    }
    const duration = statusDurationMs(item);
    let advanced = false;
    const timer = setInterval(() => {
      if (!shouldAdvanceStatus(holdingRef.current, pausedRef.current)) {
        lastTickRef.current = null;
        return;
      }
      const tick = tickStatusElapsed(elapsedRef.current, lastTickRef.current, Date.now());
      elapsedRef.current = tick.elapsedMs;
      lastTickRef.current = tick.lastTickMs;
      const ratio = statusProgressRatio(tick.elapsedMs, duration);
      setProgress(ratio);
      if (ratio >= 1 && !advanced) {
        advanced = true;
        goNext();
      }
    }, 50);
    return () => clearInterval(timer);
  }, [goNext, item]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) {
      return;
    }
    if (!shouldAdvanceStatus(holdingRef.current, pausedRef.current)) {
      node.pause();
    } else {
      void node.play().catch(() => undefined);
    }
  }, [paused, replyOpen, viewers, item?.id]);

  function releasePointer(endX: number, endY: number) {
    const holdMs = Date.now() - downAt.current;
    const swiped = isStatusSwipeUp(pressY.current, endY);
    holdingRef.current = false;
    setPaused(false);
    if (viewers) {
      return;
    }
    if (swiped && !isOwn) {
      setReplyOpen(true);
      setPaused(true);
      return;
    }
    if (isStatusTap(holdMs, swiped)) {
      const width = typeof window !== 'undefined' ? window.innerWidth : 400;
      if (tapSide(endX || pressX.current, width) === 'prev') {
        goPrev();
      } else {
        goNext();
      }
    }
  }

  function handlePressIn(event: {
    nativeEvent: { pageX?: number; pageY?: number; locationX?: number; locationY?: number };
  }) {
    pressX.current = event.nativeEvent.pageX ?? event.nativeEvent.locationX ?? 0;
    pressY.current = event.nativeEvent.pageY ?? event.nativeEvent.locationY ?? 0;
    downAt.current = Date.now();
    holdingRef.current = true;
    lastTickRef.current = null;
    setPaused(true);
  }

  function handlePressOut(event?: {
    nativeEvent?: { pageX?: number; pageY?: number; locationX?: number; locationY?: number };
  }) {
    if (typeof window !== 'undefined') {
      return;
    }
    if (!holdingRef.current) {
      return;
    }
    const endX = event?.nativeEvent?.pageX ?? event?.nativeEvent?.locationX ?? pressX.current;
    const endY = event?.nativeEvent?.pageY ?? event?.nativeEvent?.locationY ?? pressY.current;
    releasePointer(endX, endY);
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const end = (event: PointerEvent) => {
      if (!holdingRef.current) {
        return;
      }
      releasePointer(event.clientX, event.clientY);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [goNext, goPrev, isOwn, viewers]);

  async function handleDelete() {
    if (!item || !isOwn) {
      return;
    }
    try {
      await deleteStatus(item.id);
      const remaining = items.filter((entry) => entry.id !== item.id);
      if (remaining.length === 0) {
        close();
        return;
      }
      setItems(remaining);
      setIndex(Math.min(index, remaining.length - 1));
      setProgress(0);
    } catch (err) {
      setError(formatApiError(err, t('status.deleteFailed')));
    }
  }

  async function handleViewers() {
    if (!item || !isOwn) {
      return;
    }
    setPaused(true);
    try {
      setViewers(await fetchStatusViewers(item.id));
    } catch (err) {
      setError(formatApiError(err, t('status.viewersFailed')));
      setPaused(false);
    }
  }

  async function openDirectMessage(text?: string) {
    if (isOwn || replyBusy) {
      return;
    }
    setReplyBusy(true);
    try {
      const chatId = await startDirectMessage(authorUserId);
      if (text?.trim()) {
        sendTextMessage(chatId, text.trim());
      }
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'ChatsTab',
            params: { screen: 'ChatDetail', params: { chatId } },
          },
        }),
      );
    } catch (err) {
      setError(formatApiError(err, t('status.loadFailed')));
      setReplyBusy(false);
    }
  }

  const background = item?.type === 'text' ? item.backgroundColor : '#000';

  return (
    <View style={[styles.root, { backgroundColor: background || theme.colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.progressRow}>
        {items.map((entry, entryIndex) => (
          <View key={entry.id} style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
            <View
              style={[
                styles.fill,
                {
                  width:
                    entryIndex < index
                      ? '100%'
                      : entryIndex === index
                        ? `${Math.round(progress * 100)}%`
                        : '0%',
                  backgroundColor: '#fff',
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.topBar}>
        <ProfileAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
          userId={authorUserId}
          size={36}
        />
        <Text style={styles.name} numberOfLines={1}>
          {isOwn ? t('status.myStatus') : displayName}
        </Text>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !item ? (
        <View style={styles.stage}>
          <UniversalLoader size={0.4} />
        </View>
      ) : (
        <Pressable
          style={styles.stage}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={t('status.viewer')}>
          {item?.type === 'text' ? <Text style={styles.textStatus}>{item.text}</Text> : null}
          {item?.type === 'image' && item.mediaUrl ? (
            <Image source={{ uri: item.mediaUrl }} style={styles.media} resizeMode="contain" />
          ) : null}
          {item?.type === 'video' && item.mediaUrl ? (
            <StatusVideo
              uri={item.mediaUrl}
              paused={!shouldAdvanceStatus(holdingRef.current, pausedRef.current)}
              caption={item.text}
              videoRef={videoRef}
            />
          ) : null}
          {item?.type !== 'text' && item?.text ? (
            <View style={styles.captionBar}>
              <Text style={styles.caption}>{item.text}</Text>
            </View>
          ) : null}
        </Pressable>
      )}

      {isOwn && item ? (
        <View style={[styles.ownBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={() => void handleViewers()} style={styles.ownAction}>
            <Ionicons name="eye-outline" size={18} color="#fff" />
            <Text style={styles.ownLabel}>
              {t('status.seenBy')} {item.viewCount ?? 0}
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('StatusComposer', {})} style={styles.ownAction}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.ownLabel}>{t('status.add')}</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.ownAction}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.ownLabel}>{t('status.delete')}</Text>
          </Pressable>
        </View>
      ) : replyOpen && !isOwn ? (
        <View style={[styles.replyBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={() => void openDirectMessage()}
            style={styles.messageChip}
            accessibilityRole="button">
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={styles.ownLabel}>{t('status.message')}</Text>
          </Pressable>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder={t('status.replyPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.replyInput}
            onFocus={() => setPaused(true)}
          />
          <Pressable
            onPress={() => void openDirectMessage(reply)}
            disabled={replyBusy}
            accessibilityRole="button"
            accessibilityLabel={t('status.reply')}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={{ height: insets.bottom + 16 }} />
      )}

      {viewers ? (
        <View style={[styles.viewersSheet, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={() => {
              setViewers(null);
              setPaused(false);
            }}>
            <Text style={styles.ownLabel}>{t('status.closeViewers')}</Text>
          </Pressable>
          <ScrollView style={{ maxHeight: 220, marginTop: 12 }}>
            {viewers.length === 0 ? (
              <Text style={styles.ownLabel}>{t('status.noViews')}</Text>
            ) : (
              viewers.map((viewer) => (
                <Text key={viewer.userId} style={[styles.ownLabel, { marginBottom: 8 }]}>
                  {viewer.displayName}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title={t('status.confirmDeleteTitle')}
        message={t('status.confirmDeleteBody')}
        confirmLabel={t('status.delete')}
        destructive
        onConfirm={() => {
          void handleDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  name: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#fecaca',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    userSelect: 'none',
  } as object,
  textStatus: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '600',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  captionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 16,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  ownBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  ownAction: {
    alignItems: 'center',
    gap: 4,
  },
  ownLabel: {
    color: '#fff',
    fontSize: 13,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  messageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewersSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.86)',
    padding: 16,
  },
});
