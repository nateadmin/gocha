import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SettingsToggleRow } from '../../components/app';
import { CtaButton } from '../../components/brand';
import { AddressAutocompleteField } from '../../components/places/AddressAutocompleteField';
import { MemberPicker } from '../../components/chat/MemberPicker';
import { createCommunityGroup, type PublicUserProfile } from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { isSelectedPlace } from '../../places/addressPlaces';
import { useChat } from '../../chat/ChatContext';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function CreateGroupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const { theme } = useGochaTheme();
  const { refreshConversations, startGroupConversation } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showInAroundMe, setShowInAroundMe] = useState(false);
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [members, setMembers] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setPlaceId(null);
      setCity(null);
      setRegion(null);
      setLatitude(null);
      setLongitude(null);
    }
  }

  function addMember(profile: PublicUserProfile) {
    setMembers((prev) => (prev.some((member) => member.id === profile.id) ? prev : [...prev, profile]));
  }

  function removeMember(userId: number) {
    setMembers((prev) => prev.filter((member) => member.id !== userId));
  }

  async function submit() {
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }
    if (showInAroundMe && !isSelectedPlace(address, placeId)) {
      setError('Select a suggested Google address for Around Me.');
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
        const conversationId = Number.parseInt(chatId, 10);
        await createCommunityGroup({
          name: name.trim(),
          description: description.trim() || undefined,
          privacy: isPublic ? 'public' : 'private',
          showInAroundMe,
          address: showInAroundMe ? address.trim() : undefined,
          city: showInAroundMe ? city ?? undefined : undefined,
          state: showInAroundMe ? region ?? undefined : undefined,
          googlePlaceId: showInAroundMe ? placeId ?? undefined : undefined,
          latitude: showInAroundMe ? latitude : undefined,
          longitude: showInAroundMe ? longitude : undefined,
          conversationId: Number.isFinite(conversationId) ? conversationId : undefined,
        });
      }
      navigation.replace('ChatDetail', { chatId });
    } catch (err) {
      setError(formatApiError(err, 'Could not create group.'));
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
      <MemberPicker members={members} onAdd={addMember} onRemove={removeMember} />
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
        Turn this on to recommend the group to people nearby. Requires a public group and a Google address.
      </Text>

      {showInAroundMe ? (
        <AddressAutocompleteField
          value={address}
          placeId={placeId}
          placeholder="Street address"
          onChangeText={(next) => {
            setAddress(next);
            setPlaceId(null);
          }}
          onSelect={(place) => {
            setAddress(place.formattedAddress);
            setPlaceId(place.placeId);
            setCity(place.city);
            setRegion(place.state);
            setLatitude(place.latitude);
            setLongitude(place.longitude);
          }}
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
