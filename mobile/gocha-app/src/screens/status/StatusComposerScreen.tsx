import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  createMediaStatus,
  createTextStatus,
  fetchUserStatuses,
  updateStatus,
  updateStatusMedia,
} from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { LoadingShell } from '../../components/app';
import { CtaButton } from '../../components/brand/CtaButton';
import { StatusVideo } from '../../components/status/StatusVideo';
import { pickImage, pickVideo, type PickedMedia } from '../../chat/pickMedia';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import type { AppStackParamList } from '../../navigation/types';
import { nextBackground, STATUS_BACKGROUNDS } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';

async function blobFromUri(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

async function videoDurationMs(uri: string): Promise<number | undefined> {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const ms = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : undefined;
      resolve(ms);
    };
    video.onerror = () => resolve(undefined);
    video.src = uri;
  });
}

export function StatusComposerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'StatusComposer'>>();
  const insets = useSafeAreaInsets();
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const itemId = route.params?.itemId;
  const afterSave = route.params?.afterSave ?? (itemId ? 'back' : 'viewer');
  const [mode, setMode] = useState<'text' | 'image' | 'video'>('text');
  const [text, setText] = useState('');
  const [background, setBackground] = useState<string>(STATUS_BACKGROUNDS[0]);
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(Boolean(itemId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId || !user?.id) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    setHydrating(true);
    fetchUserStatuses(user.id)
      .then((payload) => {
        if (cancelled) return;
        const item = payload.items.find((entry) => entry.id === itemId);
        if (!item) {
          setError(t('status.loadFailed'));
          return;
        }
        setMode(item.type === 'image' || item.type === 'video' ? item.type : 'text');
        setText(item.text ?? '');
        setBackground(item.backgroundColor || STATUS_BACKGROUNDS[0]);
        setExistingMediaUrl(item.mediaUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(formatApiError(err, t('status.loadFailed')));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHydrating(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, t, user?.id]);

  async function chooseImage() {
    const picked = await pickImage();
    if (!picked) return;
    setMode('image');
    setMedia(picked);
  }

  async function chooseVideo() {
    const picked = await pickVideo();
    if (!picked) return;
    setMode('video');
    setMedia(picked);
  }

  async function publish() {
    const trimmed = text.trim();
    if (mode === 'text' && !trimmed) {
      setError(t('status.textRequired'));
      return;
    }
    if (mode !== 'text' && !media && !existingMediaUrl) {
      setError(t('status.mediaRequired'));
      return;
    }
    if (hydrating) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (itemId) {
        if (mode === 'text') {
          await updateStatus(itemId, { type: 'text', text: trimmed, backgroundColor: background });
        } else if (media) {
          const file = await blobFromUri(media.uri);
          const durationMs = mode === 'video' ? await videoDurationMs(media.uri) : undefined;
          await updateStatusMedia(itemId, {
            file,
            filename: media.fileName,
            type: mode,
            text: trimmed || undefined,
            durationMs,
          });
        } else {
          await updateStatus(itemId, { type: mode, text: trimmed || undefined });
        }
      } else if (mode === 'text') {
        await createTextStatus(trimmed, background);
      } else if (media) {
        const file = await blobFromUri(media.uri);
        const durationMs = mode === 'video' ? await videoDurationMs(media.uri) : undefined;
        await createMediaStatus({
          file,
          filename: media.fileName,
          type: mode,
          text: trimmed || undefined,
          durationMs,
        });
      }
      if (afterSave === 'back' || !user?.id) {
        navigation.goBack();
      } else {
        navigation.replace('StatusViewer', { userId: user.id });
      }
    } catch (err) {
      setError(formatApiError(err, itemId ? t('status.updateFailed') : t('status.postFailed')));
    } finally {
      setLoading(false);
    }
  }

  if (hydrating) {
    return <LoadingShell label={t('status.edit')} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: mode === 'text' ? background : theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="close" size={26} color={mode === 'text' ? '#fff' : theme.colors.cardForeground} />
        </Pressable>
        <Text
          style={{
            color: mode === 'text' ? '#fff' : theme.colors.cardForeground,
            fontSize: 18,
            fontWeight: '600',
          }}>
          {itemId ? t('status.edit') : t('status.add')}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        {mode === 'text' ? (
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('status.textPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.7)"
            multiline
            maxLength={700}
            style={styles.textInput}
          />
        ) : media || existingMediaUrl ? (
          <View style={{ flex: 1, width: '100%' }}>
            {mode === 'image' ? (
              <Image source={{ uri: media?.uri ?? existingMediaUrl ?? '' }} style={styles.preview} resizeMode="contain" />
            ) : (
              <StatusVideo uri={media?.uri ?? existingMediaUrl ?? ''} controls caption={media?.fileName} />
            )}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('status.captionPlaceholder')}
              placeholderTextColor={theme.colors.mutedForeground}
              style={[styles.captionInput, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
            />
          </View>
        ) : null}
      </View>

      {error ? <Text style={{ color: theme.colors.destructive, textAlign: 'center' }}>{error}</Text> : null}

      <View style={[styles.tools, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.toolRow}>
          <Pressable onPress={() => { setMode('text'); setMedia(null); }} style={styles.tool}>
            <Ionicons name="text" size={20} color={mode === 'text' ? '#fff' : theme.colors.cardForeground} />
            <Text style={[styles.toolLabel, { color: mode === 'text' ? '#fff' : theme.colors.cardForeground }]}>
              {t('status.text')}
            </Text>
          </Pressable>
          <Pressable onPress={() => void chooseImage()} style={styles.tool}>
            <Ionicons name="image-outline" size={20} color={mode === 'text' ? '#fff' : theme.colors.cardForeground} />
            <Text style={[styles.toolLabel, { color: mode === 'text' ? '#fff' : theme.colors.cardForeground }]}>
              {t('status.photo')}
            </Text>
          </Pressable>
          <Pressable onPress={() => void chooseVideo()} style={styles.tool}>
            <Ionicons name="videocam-outline" size={20} color={mode === 'text' ? '#fff' : theme.colors.cardForeground} />
            <Text style={[styles.toolLabel, { color: mode === 'text' ? '#fff' : theme.colors.cardForeground }]}>
              {t('status.video')}
            </Text>
          </Pressable>
          {mode === 'text' ? (
            <Pressable onPress={() => setBackground((value) => nextBackground(value))} style={styles.tool}>
              <Ionicons name="color-palette-outline" size={20} color="#fff" />
              <Text style={[styles.toolLabel, { color: '#fff' }]}>{t('status.color')}</Text>
            </Pressable>
          ) : null}
        </View>
        <CtaButton label={itemId ? t('status.save') : t('status.post')} loading={loading} onPress={() => void publish()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textInput: {
    width: '100%',
    color: '#fff',
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '600',
    minHeight: 160,
  },
  preview: {
    width: '100%',
    flex: 1,
    borderRadius: 12,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  tools: {
    paddingHorizontal: 16,
    gap: 12,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tool: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  toolLabel: {
    fontSize: 12,
  },
});
