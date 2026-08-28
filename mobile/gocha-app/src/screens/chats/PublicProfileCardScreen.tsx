import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, StyleSheet, Platform } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatApiError } from '../../api/formatApiError';
import { fetchPublicProfileCard, type PublicProfileCardRecord } from '../../api/client';
import { LoadingShell } from '../../components/app';
import { ProfileCardPage } from '../../components/profileCards/ProfileCardPage';
import { useAuth } from '../../context/AuthContext';
import { queueDirectChat, queueSignInThenDirectChat } from '../../profileCards/postAuthIntent';
import { profileCardShareUrl } from '../../profileCards/shareUrl';
import { copyText } from '../../utils/copyText';
import type { AppStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function PublicProfileCardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PublicProfileCard'>>();
  const { theme } = useGochaTheme();
  const { user } = useAuth();
  const slug = route.params.slug;
  const [card, setCard] = useState<PublicProfileCardRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCard(null);
      setError(null);
      fetchPublicProfileCard(slug)
        .then(setCard)
        .catch((err) => setError(formatApiError(err, 'Could not open this profile.')));
    }, [slug]),
  );

  async function copyLink() {
    if (!card?.slug) {
      return;
    }
    const ok = await copyText(profileCardShareUrl(card.slug));
    setCopied(ok);
  }

  async function handlePrimary() {
    if (!card) {
      return;
    }
    if (card.viewerIsOwner || (user && user.id === card.owner.id)) {
      setPrimaryLoading(true);
      try {
        await copyLink();
      } finally {
        setPrimaryLoading(false);
      }
      return;
    }

    setPrimaryLoading(true);
    try {
      if (!user) {
        queueSignInThenDirectChat(card.owner.id);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/');
        }
        navigation.navigate('Main');
        return;
      }
      queueDirectChat(card.owner.id);
      navigation.navigate('Main');
    } finally {
      setPrimaryLoading(false);
    }
  }

  const ownerView = Boolean(card && (card.viewerIsOwner || user?.id === card.owner.id));
  const primaryLabel = ownerView ? (copied ? 'Copied' : 'Copy link') : 'Chat';

  if (!card && !error) {
    return <LoadingShell label="Loading profile" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.navigate('Main')} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Back</Text>
      </Pressable>

      {error ? <Text style={{ color: theme.colors.destructive }}>{error}</Text> : null}

      {card ? (
        <ProfileCardPage
          displayName={card.owner.displayName}
          title={card.title}
          type={card.type}
          headline={card.headline}
          photoUrl={card.photoUrl}
          body={card.body}
          primaryLabel={primaryLabel}
          primaryLoading={primaryLoading}
          onPrimary={() => void handlePrimary()}
          onLogoPress={() => navigation.navigate('Main')}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 16, alignSelf: 'flex-start' },
});
