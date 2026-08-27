import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand';
import { ApiError, createCommunityGroup } from '../../api/client';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function CreateGroupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const { theme } = useGochaTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showInAroundMe, setShowInAroundMe] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAroundMeToggle(value: boolean) {
    setShowInAroundMe(value);
    if (value) {
      setIsPublic(true);
    }
    if (!value) {
      setAddress('');
    }
  }

  async function submit() {
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }
    if (showInAroundMe && !address.trim()) {
      setError('Enter a street address to show this group in Around Me.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const group = await createCommunityGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        privacy: isPublic ? 'public' : 'private',
        showInAroundMe,
        address: showInAroundMe ? address.trim() : undefined,
      });
      navigation.replace('GroupSettings', { groupId: group.id });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create group.');
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
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Chats</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        New group
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Group name"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description (optional)"
        multiline
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, styles.multiline, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <SettingsToggleRow
        label="Public group (discoverable in search)"
        value={isPublic}
        onValueChange={setIsPublic}
      />

      <SettingsToggleRow
        label="Show in Around Me recommendations"
        value={showInAroundMe}
        onValueChange={handleAroundMeToggle}
      />
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginBottom: 12 }}>
        Turn this on to recommend the group to people nearby. Requires a public group and a street address.
      </Text>

      {showInAroundMe ? (
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Street address"
          placeholderTextColor={theme.colors.mutedForeground}
          style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
        />
      ) : null}

      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 8 }}>{error}</Text> : null}
      <CtaButton label="Create group" loading={loading} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  title: { fontSize: 28, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontFamily: 'System',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
