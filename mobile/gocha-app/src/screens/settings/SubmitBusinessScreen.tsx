import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CtaButton } from '../../components/brand/CtaButton';
import { ApiError, submitBusinessListing } from '../../api/client';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function SubmitBusinessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await submitBusinessListing({
        name: name.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
      });
      setMessage('Submitted for admin review. Chat link will open to your account once approved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit listing.');
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
        Submit business
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16, fontFamily: theme.typography.sans }}>
        Listings stay hidden until an admin approves them. Approved listings include a chat link to you.
      </Text>

      {(['name', 'category', 'address', 'website'] as const).map((field) => {
        const valueMap = { name, category, address, website };
        const setMap = { name: setName, category: setCategory, address: setAddress, website: setWebsite };
        return (
          <TextInput
            key={field}
            value={valueMap[field]}
            onChangeText={setMap[field]}
            placeholder={field === 'name' ? 'Business name' : field.charAt(0).toUpperCase() + field.slice(1)}
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize={field === 'website' ? 'none' : 'sentences'}
            style={[
              styles.input,
              {
                color: theme.colors.cardForeground,
                borderColor: theme.colors.border,
                fontFamily: theme.typography.sans,
              },
            ]}
          />
        );
      })}
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
        placeholderTextColor={theme.colors.mutedForeground}
        style={[
          styles.input,
          styles.multiline,
          {
            color: theme.colors.cardForeground,
            borderColor: theme.colors.border,
            fontFamily: theme.typography.sans,
          },
        ]}
      />

      {error ? <Text style={{ color: theme.colors.destructive }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.primary, marginBottom: 12 }}>{message}</Text> : null}
      <CtaButton label="Submit for review" loading={loading} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});
