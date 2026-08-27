import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand';
import {
  ApiError,
  fetchMyCommunityGroups,
  updateCommunityGroup,
  type CommunityGroupRecord,
} from '../../api/client';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function GroupSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const route = useRoute<RouteProp<ChatsStackParamList, 'GroupSettings'>>();
  const { theme } = useGochaTheme();
  const [group, setGroup] = useState<CommunityGroupRecord | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showInAroundMe, setShowInAroundMe] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const groups = await fetchMyCommunityGroups();
    const match = groups.find((item) => item.id === route.params.groupId);
    if (!match) {
      setError('Group not found.');
      return;
    }
    setGroup(match);
    setName(match.name);
    setDescription(match.description ?? '');
    setIsPublic(match.privacy === 'public');
    setShowInAroundMe(match.showInAroundMe);
    setAddress(match.address ?? '');
  }, [route.params.groupId]);

  useEffect(() => {
    load().catch(() => setError('Could not load group.'));
  }, [load]);

  function handleAroundMeToggle(value: boolean) {
    setShowInAroundMe(value);
    if (value) {
      setIsPublic(true);
    }
    if (!value) {
      setAddress('');
    }
  }

  async function save() {
    if (!group || !name.trim()) return;
    if (showInAroundMe && !address.trim()) {
      setError('Enter a street address to show this group in Around Me.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateCommunityGroup(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        privacy: isPublic ? 'public' : 'private',
        showInAroundMe,
        address: showInAroundMe ? address.trim() : undefined,
      });
      setGroup(updated);
      setMessage('Group settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save group.');
    } finally {
      setLoading(false);
    }
  }

  if (!group && !error) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans }}>Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.colors.cardForeground, fontFamily: theme.typography.serif }]}>
        Group settings
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
        placeholder="Description"
        multiline
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, styles.multiline, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />

      <SettingsToggleRow label="Public group" value={isPublic} onValueChange={setIsPublic} />

      <SettingsToggleRow
        label="Show in Around Me recommendations"
        value={showInAroundMe}
        onValueChange={handleAroundMeToggle}
      />

      {showInAroundMe ? (
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Street address"
          placeholderTextColor={theme.colors.mutedForeground}
          style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
        />
      ) : null}

      {error ? <Text style={{ color: theme.colors.destructive }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.primary, marginBottom: 8 }}>{message}</Text> : null}
      <CtaButton label="Save settings" loading={loading} onPress={save} />
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
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
