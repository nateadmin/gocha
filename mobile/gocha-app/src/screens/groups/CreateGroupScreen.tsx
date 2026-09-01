import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand';
import { ApiError, createCommunityGroup, searchUsers, type PublicUserProfile } from '../../api/client';
import { useChat } from '../../chat/ChatContext';
import { useAuth } from '../../context/AuthContext';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function CreateGroupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user } = useAuth();
  const { startGroupConversation } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showInAroundMe, setShowInAroundMe] = useState(false);
  const [address, setAddress] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<PublicUserProfile[]>([]);
  const [members, setMembers] = useState<PublicUserProfile[]>([]);
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

  useEffect(() => {
    const needle = memberQuery.trim();
    if (needle.length < 2) {
      setMemberResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void searchUsers(needle)
        .then((results) => {
          if (cancelled) return;
          const selected = new Set(members.map((member) => member.id));
          setMemberResults(
            results.filter((result) => result.id !== user?.id && !selected.has(result.id)),
          );
        })
        .catch(() => {
          if (!cancelled) {
            setMemberResults([]);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [memberQuery, members, user?.id]);

  function addMember(profile: PublicUserProfile) {
    setMembers((prev) => (prev.some((member) => member.id === profile.id) ? prev : [...prev, profile]));
    setMemberQuery('');
    setMemberResults([]);
  }

  function removeMember(userId: number) {
    setMembers((prev) => prev.filter((member) => member.id !== userId));
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
      const chatId = await startGroupConversation(
        name.trim(),
        members.map((member) => member.id),
      );
      const wantsCommunity = Boolean(description.trim() || isPublic || showInAroundMe);
      if (wantsCommunity) {
        try {
          await createCommunityGroup({
            name: name.trim(),
            description: description.trim() || undefined,
            privacy: isPublic ? 'public' : 'private',
            showInAroundMe,
            address: showInAroundMe ? address.trim() : undefined,
          });
        } catch {
          // Chat group already exists; Around Me listing is optional.
        }
      }
      navigation.replace('ChatDetail', { chatId });
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
        value={memberQuery}
        onChangeText={setMemberQuery}
        placeholder="Add people"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />
      {memberResults.map((result) => (
        <Pressable
          key={result.id}
          onPress={() => addMember(result)}
          style={[styles.result, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.cardForeground }}>{result.displayName}</Text>
          {result.username ? (
            <Text style={{ color: theme.colors.mutedForeground }}>@{result.username}</Text>
          ) : null}
        </Pressable>
      ))}
      {members.length > 0 ? (
        <View style={styles.chips}>
          {members.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => removeMember(member.id)}
              style={[styles.chip, { backgroundColor: theme.colors.muted }]}>
              <Text style={{ color: theme.colors.cardForeground }}>{member.displayName}</Text>
              <Ionicons name="close" size={14} color={theme.colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      ) : null}
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
  result: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
