import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CtaButton } from '../brand';
import { AddressAutocompleteField } from '../places/AddressAutocompleteField';
import { isSelectedPlace } from '../../places/addressPlaces';
import { pickImage, type PickedMedia } from '../../chat/pickMedia';
import { SettingsToggleRow } from '../app';
import { useGochaTheme } from '../../theme';

export type GroupPostKind = 'offer' | 'poll' | 'rsvp';

export type GroupPostDraft = {
  type: GroupPostKind;
  title?: string;
  description?: string;
  location?: string;
  question?: string;
  kind?: 'vote' | 'multi';
  options?: string[];
  when?: string;
  where?: string;
  image?: PickedMedia;
};

type Props = {
  kind: GroupPostKind | null;
  onClose: () => void;
  onSubmit: (draft: GroupPostDraft) => Promise<void>;
};

export function GroupPostComposer({ kind, onClose, onSubmit }: Props) {
  const { theme } = useGochaTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationPlaceId, setLocationPlaceId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [multi, setMulti] = useState(false);
  const [when, setWhen] = useState('');
  const [where, setWhere] = useState('');
  const [wherePlaceId, setWherePlaceId] = useState<string | null>(null);
  const [image, setImage] = useState<PickedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heading = kind === 'offer' ? 'Offer item' : kind === 'poll' ? 'Poll' : kind === 'rsvp' ? 'RSVP' : '';

  async function choosePhoto() {
    const picked = await pickImage();
    if (picked) {
      setImage(picked);
    }
  }

  async function submit() {
    if (!kind) return;
    setError(null);
    if (kind === 'offer' && !title.trim()) {
      setError('Title is required.');
      return;
    }
    if (kind === 'poll' && !question.trim()) {
      setError('Question is required.');
      return;
    }
    if (kind === 'poll' && (!optionA.trim() || !optionB.trim())) {
      setError('Add at least two options.');
      return;
    }
    if (kind === 'rsvp' && !title.trim()) {
      setError('Title is required.');
      return;
    }
    if (kind === 'offer' && location.trim() && !isSelectedPlace(location, locationPlaceId)) {
      setError('Select a suggested Google address for location.');
      return;
    }
    if (kind === 'rsvp' && where.trim() && !isSelectedPlace(where, wherePlaceId)) {
      setError('Select a suggested Google address for where.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        type: kind,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        question: question.trim(),
        kind: multi ? 'multi' : 'vote',
        options: [optionA, optionB, optionC].map((item) => item.trim()).filter(Boolean),
        when: when.trim(),
        where: where.trim(),
        image: image ?? undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={kind !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={(event) => event.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.head}>
              <Text style={{ color: theme.colors.cardForeground, fontSize: 18, fontWeight: '600' }}>{heading}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.colors.mutedForeground} />
              </Pressable>
            </View>

            {kind === 'offer' ? (
              <>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <AddressAutocompleteField
                  value={location}
                  placeId={locationPlaceId}
                  types="geocode"
                  placeholder="Location"
                  onChangeText={(next) => {
                    setLocation(next);
                    setLocationPlaceId(null);
                  }}
                  onSelect={(place) => {
                    setLocation(place.formattedAddress);
                    setLocationPlaceId(place.placeId);
                  }}
                />
                <Pressable onPress={choosePhoto} style={[styles.input, { borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.primary }}>{image ? image.fileName : 'Photo'}</Text>
                </Pressable>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
                ) : null}
              </>
            ) : null}

            {kind === 'poll' ? (
              <>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Question"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <TextInput
                  value={optionA}
                  onChangeText={setOptionA}
                  placeholder="Option 1"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <TextInput
                  value={optionB}
                  onChangeText={setOptionB}
                  placeholder="Option 2"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <TextInput
                  value={optionC}
                  onChangeText={setOptionC}
                  placeholder="Option 3"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <SettingsToggleRow
                  icon="checkbox-outline"
                  label="Allow multiple answers"
                  value={multi}
                  onValueChange={setMulti}
                />
              </>
            ) : null}

            {kind === 'rsvp' ? (
              <>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <TextInput
                  value={when}
                  onChangeText={setWhen}
                  placeholder="When"
                  placeholderTextColor={theme.colors.mutedForeground}
                  style={[styles.input, { color: theme.colors.cardForeground, borderColor: theme.colors.border }]}
                />
                <AddressAutocompleteField
                  value={where}
                  placeId={wherePlaceId}
                  types="geocode"
                  placeholder="Where"
                  onChangeText={(next) => {
                    setWhere(next);
                    setWherePlaceId(null);
                  }}
                  onSelect={(place) => {
                    setWhere(place.formattedAddress);
                    setWherePlaceId(place.placeId);
                  }}
                />
              </>
            ) : null}

            {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 8 }}>{error}</Text> : null}
            <CtaButton label="Post" loading={loading} onPress={() => void submit()} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    maxHeight: '88%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },
});
