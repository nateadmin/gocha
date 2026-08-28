import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatApiError } from '../../api/formatApiError';
import {
  approveProfileCardAccess,
  declineProfileCardAccess,
  fetchProfileCardRequests,
  type ProfileCardAccessRecord,
} from '../../api/client';
import { LoadingShell } from '../../components/app';
import { CtaButton } from '../../components/brand';
import type { SettingsStackParamList } from '../../navigation/types';
import { useGochaTheme } from '../../theme';

export function ProfileCardRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { theme } = useGochaTheme();
  const [requests, setRequests] = useState<ProfileCardAccessRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchProfileCardRequests()
      .then(setRequests)
      .catch((err) => {
        setError(formatApiError(err, 'Could not load requests.'));
        setRequests([]);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function decide(id: number, action: 'approve' | 'decline') {
    setBusyId(id);
    setError(null);
    try {
      if (action === 'approve') {
        await approveProfileCardAccess(id);
      } else {
        await declineProfileCardAccess(id);
      }
      setRequests((prev) => (prev ?? []).filter((item) => item.id !== id));
    } catch (err) {
      setError(formatApiError(err, 'Could not update that request.'));
    } finally {
      setBusyId(null);
    }
  }

  if (requests === null && !error) {
    return <LoadingShell label="Loading requests" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Back</Text>
      </Pressable>

      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 28,
          marginBottom: 8,
        }}>
        Access requests
      </Text>
      <Text style={{ color: theme.colors.mutedForeground, marginBottom: 16 }}>
        Approve who can load a private profile card.
      </Text>

      {error ? <Text style={{ color: theme.colors.destructive, marginBottom: 12 }}>{error}</Text> : null}

      {(requests ?? []).length === 0 ? (
        <Text style={{ color: theme.colors.mutedForeground }}>No pending requests.</Text>
      ) : (
        (requests ?? []).map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.card,
              },
            ]}>
            <Text style={{ color: theme.colors.cardForeground, fontWeight: '600', fontSize: 16 }}>
              {item.viewer?.displayName ?? 'Someone'}
            </Text>
            <Text style={{ color: theme.colors.mutedForeground, marginTop: 4 }}>
              wants access to {item.cardTitle ?? 'a profile'}
            </Text>
            <View style={styles.actions}>
              <Pressable
                disabled={busyId === item.id}
                onPress={() => void decide(item.id, 'decline')}
                style={styles.decline}>
                <Text style={{ color: theme.colors.destructive }}>Decline</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <CtaButton
                  compact
                  label="Approve"
                  loading={busyId === item.id}
                  onPress={() => void decide(item.id, 'approve')}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  card: { borderWidth: 1, padding: 14, marginBottom: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  decline: { paddingVertical: 10, paddingHorizontal: 8 },
});
