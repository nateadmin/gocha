import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatApiError } from '../../api/formatApiError';
import { deleteStatus, fetchUserStatuses, type StatusItemRecord } from '../../api/client';
import { ConfirmDialog, LoadingShell } from '../../components/app';
import { CtaButton } from '../../components/brand/CtaButton';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { openStatusComposer } from '../../navigation/rootNavigation';
import type { SettingsStackParamList } from '../../navigation/types';
import { statusExpiresLabel } from '../../status/statusLogic';
import { useGochaTheme } from '../../theme';

export function StatusSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<StatusItemRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const loadedForUser = useRef<number | null>(null);

  const load = useCallback(() => {
    if (!user?.id) {
      loadedForUser.current = null;
      setItems([]);
      return;
    }
    if (loadedForUser.current !== user.id) {
      loadedForUser.current = user.id;
      setItems(null);
    }
    setError(null);
    fetchUserStatuses(user.id)
      .then((payload) => setItems(payload.items))
      .catch((err) => {
        setError(formatApiError(err, t('status.loadFailed')));
        setItems([]);
      });
  }, [t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function confirmDelete() {
    if (deleteId == null) {
      return;
    }
    setBusy(true);
    try {
      await deleteStatus(deleteId);
      setItems((prev) => (prev ?? []).filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(formatApiError(err, t('status.deleteFailed')));
    } finally {
      setBusy(false);
    }
  }

  if (items === null && !error) {
    return <LoadingShell label={t('status.myStatus')} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button">
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 16 }}>
          {t('settings.title')}
        </Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 8,
        }}>
        {t('status.myStatus')}
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: 20,
        }}>
        {t('status.manageHint')}
      </Text>

      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 12 }}>{error}</Text> : null}

      {(items ?? []).length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16 }}>{t('status.empty')}</Text>
      ) : (
        (items ?? []).map((item) => (
          <View
            key={item.id}
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.card,
              },
            ]}>
            <Pressable
              onPress={() => openStatusComposer({ itemId: item.id, afterSave: 'back' })}
              style={styles.main}
              accessibilityRole="button"
              accessibilityLabel={t('status.edit')}>
              {item.type === 'image' && item.mediaUrl ? (
                <Image source={{ uri: item.mediaUrl }} style={styles.thumb} />
              ) : (
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: item.type === 'text' ? item.backgroundColor : theme.colors.muted },
                  ]}>
                  <Ionicons
                    name={item.type === 'video' ? 'videocam' : 'text'}
                    size={16}
                    color="#fff"
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    color: theme.colors.cardForeground,
                    fontFamily: theme.typography.sans,
                    fontWeight: '600',
                  }}>
                  {item.text?.trim() || (item.type === 'image' ? t('status.photo') : item.type === 'video' ? t('status.video') : t('status.text'))}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                  {statusExpiresLabel(item.expiresAt)}
                </Text>
              </View>
              <Ionicons name="create-outline" size={18} color={theme.colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => setDeleteId(item.id)}
              style={styles.delete}
              accessibilityRole="button"
              accessibilityLabel={t('status.delete')}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.destructive} />
            </Pressable>
          </View>
        ))
      )}

      <View style={{ marginTop: 8 }}>
        <CtaButton
          label={t('status.add')}
          onPress={() => openStatusComposer({ afterSave: 'back' })}
        />
      </View>

      <ConfirmDialog
        visible={deleteId !== null}
        title={t('status.confirmDeleteTitle')}
        message={t('status.confirmDeleteBody')}
        confirmLabel={t('status.delete')}
        destructive
        onConfirm={() => {
          if (!busy) {
            void confirmDelete();
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null),
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
});
