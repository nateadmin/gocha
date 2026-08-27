import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CtaButton } from '../../components/brand';
import { ApiError, updateUsername } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function UsernameSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user, refresh } = useAuth();
  const [username, setUsername] = useState(user?.username ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const value = username.trim().toLowerCase();
    if (value.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      setError('Use lowercase letters, numbers, and underscores only.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updateUsername(value);
      await refresh();
      setMessage('Username saved. Others can tag you with @' + value);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save username.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Settings</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        Username
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16 }}>
        Your unique handle for tags and search, like WhatsApp. Must be unique across Gocha.
      </Text>

      <View style={[styles.atRow, { borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.mutedForeground, fontSize: 17 }}>@</Text>
        <TextInput
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase())}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="username"
          placeholderTextColor={theme.colors.mutedForeground}
          style={{ flex: 1, color: theme.colors.cardForeground, fontSize: 17 }}
        />
      </View>

      {error ? <Text style={{ color: theme.colors.destructive, marginTop: 8 }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.primary, marginTop: 8 }}>{message}</Text> : null}
      <View style={{ marginTop: 16 }}>
        <CtaButton label="Save username" loading={loading} onPress={save} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 8 },
  atRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
