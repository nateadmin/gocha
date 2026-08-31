import { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { createMediaStatus, createTextStatus } from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
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
  const insets = useSafeAreaInsets();
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mode, setMode] = useState<'text' | 'image' | 'video'>('text');
  const [text, setText] = useState('');
  const [background, setBackground] = useState<string>(STATUS_BACKGROUNDS[0]);
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    try {
      if (mode === 'text') {
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
      if (user?.id) {
        navigation.replace('StatusViewer', { userId: user.id });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      setError(formatApiError(err, t('status.postFailed')));
    } finally {
      setLoading(false);
    }
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
          {t('status.add')}
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
        ) : media ? (
          <View style={{ flex: 1, width: '100%' }}>
            {mode === 'image' ? (
              <Image source={{ uri: media.uri }} style={styles.preview} resizeMode="contain" />
            ) : (
              <StatusVideo uri={media.uri} controls caption={media.fileName} />
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
        <CtaButton label={t('status.post')} loading={loading} onPress={() => void publish()} />
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
