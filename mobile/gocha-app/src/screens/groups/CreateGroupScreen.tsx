import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand';
import { ApiError, createCommunityGroup, globalSearch, type PublicUserProfile } from '../../api/client';
import { useChat } from '../../chat/ChatContext';
import { searchLocalContacts } from '../../chat/globalSearchLocal';
import { useAuth } from '../../context/AuthContext';
import {
  mergeGroupMemberResults,
  profileFromLocalChat,
  profileFromSearchContact,
} from '../../groups/groupMemberSearch';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function CreateGroupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const { theme } = useGochaTheme();
  const { user } = useAuth();
  const { chats, archivedChats, refreshConversations, startGroupConversation } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showInAroundMe, setShowInAroundMe] = useState(false);
  const [address, setAddress] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [remoteContacts, setRemoteContacts] = useState<PublicUserProfile[]>([]);
  const [remotePeople, setRemotePeople] = useState<PublicUserProfile[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [members, setMembers] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchableChats = useMemo(() => [...chats, ...archivedChats], [archivedChats, chats]);
  const selectedIds = useMemo(() => members.map((member) => member.id), [members]);
  const localMembers = useMemo(() => {
    const needle = memberQuery.trim();
    if (!needle) {
      return [];
    }
    return searchLocalContacts(searchableChats, needle, new Set()).flatMap((chat) => {
      const profile = profileFromLocalChat(chat);
      return profile ? [profile] : [];
    });
  }, [memberQuery, searchableChats]);
  const memberResults = useMemo(
    () =>
      mergeGroupMemberResults({
        local: localMembers,
        contacts: remoteContacts,
        people: remotePeople,
        excludeIds: [user?.id ?? 0, ...selectedIds],
      }),
    [localMembers, remoteContacts, remotePeople, selectedIds, user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshConversations();
    }, [refreshConversations]),
  );

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
      setRemoteContacts([]);
      setRemotePeople([]);
      setMemberSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setMemberSearchLoading(true);
      void globalSearch(needle)
        .then((payload) => {
          if (cancelled) {
            return;
          }
          setRemoteContacts(payload.contacts.map(profileFromSearchContact));
          setRemotePeople(payload.people);
        })
        .catch(() => {
          if (!cancelled) {
            setRemoteContacts([]);
            setRemotePeople([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setMemberSearchLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [memberQuery]);

  function addMember(profile: PublicUserProfile) {
    setMembers((prev) => (prev.some((member) => member.id === profile.id) ? prev : [...prev, profile]));
    setMemberQuery('');
    setRemoteContacts([]);
    setRemotePeople([]);
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
        autoCorrect={false}
        autoCapitalize="none"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
      />
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
        Type a name to pick people from your chats.
      </Text>
      {memberSearchLoading && memberResults.length === 0 ? (
        <View style={styles.searching}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={{ color: theme.colors.mutedForeground }}>Searching…</Text>
        </View>
      ) : null}
      {memberResults.map((result) => (
        <Pressable
          key={result.id}
          onPress={() => addMember(result)}
          accessibilityRole="button"
          accessibilityLabel={`Add ${result.displayName}`}
          style={[styles.result, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.cardForeground }}>{result.displayName}</Text>
          {result.username ? (
            <Text style={{ color: theme.colors.mutedForeground }}>@{result.username}</Text>
          ) : null}
        </Pressable>
      ))}
      {memberQuery.trim().length >= 2 && !memberSearchLoading && memberResults.length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground, marginBottom: 12 }}>
          No matching people in your chats.
        </Text>
      ) : null}
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
  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
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
