import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatApiError } from '../../api/formatApiError';
import { fetchProfileCard, type ProfileCardRecord } from '../../api/client';
import { LoadingShell } from '../../components/app';
import { profileCardIcon } from '../../profileCards/profileCardMeta';
import type { ChatsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function ProfileCardDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const route = useRoute<RouteProp<ChatsStackParamList, 'ProfileCardDetail'>>();
  const { theme } = useGochaTheme();
  const [card, setCard] = useState<ProfileCardRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setCard(null);
      setError(null);
      fetchProfileCard(route.params.cardId)
        .then(setCard)
        .catch((err) => setError(formatApiError(err, 'Could not open this profile.')));
    }, [route.params.cardId]),
  );

  if (!card && !error) {
    return <LoadingShell label="Loading profile" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Profile</Text>
      </Pressable>

      {error ? <Text style={{ color: theme.colors.destructive }}>{error}</Text> : null}

      {card ? (
        <>
          {card.photoUrl ? (
            <Image source={{ uri: card.photoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoFallback, { backgroundColor: theme.colors.muted }]}>
              <Ionicons name={profileCardIcon(card.type)} size={36} color={theme.colors.primary} />
            </View>
          )}
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.serif,
              fontSize: 26,
              textAlign: 'center',
              marginTop: 12,
            }}>
            {card.title}
          </Text>
          {card.headline ? (
            <Text style={{ color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 6 }}>
              {card.headline}
            </Text>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <DetailRow label="Company" value={card.body.company} />
            <DetailRow label="Role" value={card.body.role} />
            <DetailRow label="Location" value={card.body.location} />
            <DetailRow label="Looking for" value={card.body.lookingFor} />
            <DetailRow label="Skills" value={card.body.skills} />
            <DetailRow label="Interests" value={card.body.interests} />
            <DetailRow label="Website" value={card.body.website} />
            <DetailRow label="About" value={card.body.about} />
            <DetailRow label="Details" value={card.body.details} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  const { theme } = useGochaTheme();
  if (!value) return null;
  return (
    <View style={[styles.row, { borderColor: theme.colors.border }]}>
      <Text style={{ color: theme.colors.mutedForeground, fontSize: 12, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ color: theme.colors.cardForeground, fontSize: 16, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, alignItems: 'stretch' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 16, alignSelf: 'flex-start' },
  photo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
