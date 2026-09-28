import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { globalSearch, type PublicUserProfile } from '../../api/client';
import { searchLocalContacts } from '../../chat/globalSearchLocal';
import { useChat } from '../../chat/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  mergeGroupMemberResults,
  profileFromLocalChat,
  profileFromSearchContact,
} from '../../groups/groupMemberSearch';
import { useGochaTheme } from '../../theme';

type Props = {
  members: PublicUserProfile[];
  onAdd: (profile: PublicUserProfile) => void;
  onRemove: (userId: number) => void;
  extraExcludeIds?: number[];
  helperText?: string;
};

export function MemberPicker({
  members,
  onAdd,
  onRemove,
  extraExcludeIds = [],
  helperText = 'Type a name to pick people from your chats.',
}: Props) {
  const { theme } = useGochaTheme();
  const { user } = useAuth();
  const { chats, archivedChats } = useChat();
  const [memberQuery, setMemberQuery] = useState('');
  const [remoteContacts, setRemoteContacts] = useState<PublicUserProfile[]>([]);
  const [remotePeople, setRemotePeople] = useState<PublicUserProfile[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
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
        excludeIds: [user?.id ?? 0, ...selectedIds, ...extraExcludeIds],
      }),
    [extraExcludeIds, localMembers, remoteContacts, remotePeople, selectedIds, user?.id],
  );

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
    onAdd(profile);
    setMemberQuery('');
    setRemoteContacts([]);
    setRemotePeople([]);
  }

  return (
    <View>
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
        {helperText}
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
              onPress={() => onRemove(member.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${member.displayName}`}
              style={[styles.chip, { backgroundColor: theme.colors.muted }]}>
              <Text style={{ color: theme.colors.cardForeground }}>{member.displayName}</Text>
              <Ionicons name="close" size={14} color={theme.colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontFamily: 'System',
  },
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
