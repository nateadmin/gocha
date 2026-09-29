import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '../../components/app';
import { BrandBadge, CtaButton } from '../../components/brand';
import {
  ApiError,
  approveCommunityGroupJoinRequest,
  declineCommunityGroupJoinRequest,
  fetchDiscoverableGroups,
  requestJoinCommunityGroup,
  type CommunityGroupRecord,
} from '../../api/client';
import { formatApiError } from '../../api/formatApiError';
import { discoverableGroups as mockGroups } from '../../data/mock';
import { useGochaTheme } from '../../theme';

type AroundMeCard = {
  id: string;
  liveId: number | null;
  name: string;
  description: string;
  memberCount: number;
  avatarLabel: string;
  avatarColor: string;
  interestTags: string[];
  membershipStatus: 'none' | 'pending' | 'member' | 'owner';
  pendingRequests: NonNullable<CommunityGroupRecord['pendingRequests']>;
};

function mapApiGroup(group: CommunityGroupRecord): AroundMeCard {
  const location = group.city && group.state ? `${group.city}, ${group.state}` : group.address;
  return {
    id: String(group.id),
    liveId: group.id,
    name: group.name,
    description: group.description ?? '',
    memberCount: group.memberCount,
    avatarLabel: group.avatarLabel ?? group.name.slice(0, 2).toUpperCase(),
    avatarColor: group.avatarColor ?? '#1B00D8',
    interestTags: location ? [location] : [],
    membershipStatus: group.membershipStatus ?? 'none',
    pendingRequests: group.pendingRequests ?? [],
  };
}

function joinButtonLabel(status: AroundMeCard['membershipStatus']): string {
  if (status === 'pending') return 'Requested';
  if (status === 'member') return 'Joined';
  if (status === 'owner') return 'Your group';
  return 'Request to join';
}

export function AroundMeScreen() {
  const { theme } = useGochaTheme();
  const [apiGroups, setApiGroups] = useState<CommunityGroupRecord[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cardMessage, setCardMessage] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetchDiscoverableGroups()
      .then(setApiGroups)
      .catch(() => setApiGroups([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo<AroundMeCard[]>(() => {
    if (apiGroups.length > 0) {
      return apiGroups.map(mapApiGroup);
    }
    return mockGroups.map((group) => ({
      id: group.id,
      liveId: null,
      name: group.name,
      description: group.description,
      memberCount: group.memberCount,
      avatarLabel: group.avatarLabel,
      avatarColor: group.avatarColor,
      interestTags: group.interestTags,
      membershipStatus: 'none' as const,
      pendingRequests: [],
    }));
  }, [apiGroups]);

  function mergeGroup(updated: CommunityGroupRecord) {
    setApiGroups((prev) => {
      const index = prev.findIndex((item) => item.id === updated.id);
      if (index === -1) {
        return prev;
      }
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  async function handleJoin(card: AroundMeCard) {
    if (!card.liveId) {
      setCardMessage((prev) => ({
        ...prev,
        [card.id]: 'This is a sample listing. Create a public Around Me group to take real join requests.',
      }));
      return;
    }
    if (card.membershipStatus !== 'none') {
      return;
    }
    setBusyId(card.id);
    setCardMessage((prev) => {
      const next = { ...prev };
      delete next[card.id];
      return next;
    });
    try {
      const payload = await requestJoinCommunityGroup(card.liveId);
      mergeGroup(payload.group);
      setCardMessage((prev) => ({
        ...prev,
        [card.id]: 'Request sent. The group owner will review it.',
      }));
    } catch (err) {
      setCardMessage((prev) => ({
        ...prev,
        [card.id]: err instanceof ApiError ? formatApiError(err, 'Could not send join request.') : 'Could not send join request.',
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecide(card: AroundMeCard, requestId: number, decision: 'approve' | 'decline') {
    if (!card.liveId) return;
    setBusyId(`${card.id}:${requestId}`);
    try {
      const payload =
        decision === 'approve'
          ? await approveCommunityGroupJoinRequest(card.liveId, requestId)
          : await declineCommunityGroupJoinRequest(card.liveId, requestId);
      mergeGroup(payload.group);
    } catch (err) {
      setCardMessage((prev) => ({
        ...prev,
        [card.id]: err instanceof ApiError ? formatApiError(err, 'Could not update request.') : 'Could not update request.',
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Text
        style={{
          color: theme.colors.cardForeground,
          fontFamily: theme.typography.serif,
          fontSize: 26,
        }}>
        Around Me
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.sans,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 8,
        }}>
        Discover local public groups with a location. Private groups stay invite-only.
      </Text>

      {groups.map((group) => (
        <View
          key={group.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
            },
          ]}>
          <View style={styles.cardHeader}>
            <Avatar label={group.avatarLabel} color={group.avatarColor} size={48} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 17,
                  fontWeight: '600',
                }}>
                {group.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 13,
                }}>
                {group.memberCount} members
              </Text>
            </View>
            <BrandBadge label="Discoverable" tone="secondary" />
          </View>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 14,
              lineHeight: 20,
            }}>
            {group.description}
          </Text>
          <View style={styles.tagsRow}>
            <View style={styles.tags}>
              {group.interestTags.map((tag) => (
                <BrandBadge key={tag} label={tag} />
              ))}
            </View>
            <CtaButton
              label={joinButtonLabel(group.membershipStatus)}
              fullWidth={false}
              compact
              loading={busyId === group.id}
              disabled={group.membershipStatus !== 'none' && group.liveId !== null}
              onPress={() => handleJoin(group)}
            />
          </View>
          {cardMessage[group.id] ? (
            <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.sans, fontSize: 13 }}>
              {cardMessage[group.id]}
            </Text>
          ) : null}
          {group.membershipStatus === 'owner' && group.pendingRequests.length > 0 ? (
            <View style={styles.requests}>
              <Text
                style={{
                  color: theme.colors.cardForeground,
                  fontFamily: theme.typography.sans,
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                Join requests
              </Text>
              {group.pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestRow}>
                  <Text
                    style={{
                      flex: 1,
                      color: theme.colors.cardForeground,
                      fontFamily: theme.typography.sans,
                      fontSize: 14,
                    }}>
                    {request.user?.displayName ?? 'Gocha user'}
                  </Text>
                  <CtaButton
                    label="Approve"
                    fullWidth={false}
                    compact
                    loading={busyId === `${group.id}:${request.id}`}
                    onPress={() => handleDecide(group, request.id, 'approve')}
                  />
                  <CtaButton
                    label="Decline"
                    fullWidth={false}
                    compact
                    disabled={busyId === `${group.id}:${request.id}`}
                    onPress={() => handleDecide(group, request.id, 'decline')}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      <View
        style={[
          styles.privateNote,
          {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.radii.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <Ionicons name="lock-closed-outline" size={18} color={theme.colors.primary} />
        <Text
          style={{
            flex: 1,
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 13,
            lineHeight: 18,
          }}>
          Private groups are hidden from Around Me. Join only through a direct invitation
          from the group admin.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requests: {
    gap: 8,
    paddingTop: 4,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privateNote: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
});
