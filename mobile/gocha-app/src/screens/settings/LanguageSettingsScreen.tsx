import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LANGUAGE_OPTIONS, type AppLanguageCode } from '../../i18n/languages';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function LanguageSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user, updateLanguage } = useAuth();
  const { language, t, setLanguage } = useLanguage();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selected = user?.language ?? language;

  async function choose(code: AppLanguageCode) {
    if (code === selected || saving) {
      return;
    }
    setSaving(code);
    setError(null);
    setMessage(null);
    try {
      await updateLanguage(code);
      setLanguage(code);
      setMessage(t('language.saved'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('language.couldNotSave'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>
          {t('settings.title')}
        </Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        {t('language.title')}
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16, fontFamily: theme.typography.sans }}>
        {t('language.subtitle')}
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.card,
          },
        ]}>
        {LANGUAGE_OPTIONS.map((option, index) => {
          const isSelected = option.code === selected;
          return (
            <View key={option.code}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.border }]} /> : null}
              <Pressable
                onPress={() => choose(option.code)}
                accessibilityRole="button"
                style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 16 }}>
                    {option.nativeName}
                  </Text>
                  <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.sans, fontSize: 13 }}>
                    {option.name}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      {error ? <Text style={{ color: theme.colors.destructive, marginTop: 12 }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.primary, marginTop: 12 }}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
