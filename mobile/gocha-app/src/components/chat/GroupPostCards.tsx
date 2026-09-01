import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ChatMessage, OfferPost, PollPost, RsvpPost } from '../../chat/types';
import { useGochaTheme } from '../../theme';

type Act = (action: 'claim' | 'unclaim' | 'taken' | 'release' | 'vote' | 'close', choice?: string) => void;

type CardProps = {
  message: ChatMessage;
  onAct?: Act;
};

function locationLine(offer: OfferPost): string {
  const kind = offer.locationKind === 'meetup' ? 'Meetup' : offer.locationKind === 'ship' ? 'Ship' : 'Pickup';
  return offer.location ? `${kind} · ${offer.location}` : kind;
}

export function OfferCard({ message, onAct }: CardProps) {
  const { theme } = useGochaTheme();
  const offer = message.post?.offer;
  if (!offer) return null;
  const taken = offer.status === 'taken';

  return (
    <View
      style={[
        styles.card,
        taken ? styles.cardTaken : null,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}>
      {taken ? (
        <View style={styles.takenRow}>
          {offer.imageUrl ? (
            <Image source={{ uri: offer.imageUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: theme.colors.muted }]} />
          )}
          <View style={styles.takenBody}>
            <View style={styles.takenHead}>
              <Text style={[styles.title, { color: theme.colors.cardForeground, flex: 1 }]} numberOfLines={2}>
                {offer.title}
              </Text>
              <View style={[styles.badge, { backgroundColor: theme.colors.mutedForeground }]}>
                <Text style={{ color: theme.colors.card, fontSize: 11, fontWeight: '700' }}>TAKEN</Text>
              </View>
            </View>
            {offer.description ? (
              <Text style={{ color: theme.colors.mutedForeground, fontSize: 13 }} numberOfLines={2}>
                {offer.description}
              </Text>
            ) : null}
            <Text style={{ color: theme.colors.primary, fontSize: 13 }}>{locationLine(offer)}</Text>
          </View>
        </View>
      ) : (
        <>
          {offer.imageUrl ? (
            <Image source={{ uri: offer.imageUrl }} style={styles.hero} resizeMode="cover" />
          ) : null}
          <Text style={[styles.title, { color: theme.colors.cardForeground }]}>{offer.title}</Text>
          {offer.description ? (
            <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>{offer.description}</Text>
          ) : null}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontSize: 13 }}>{locationLine(offer)}</Text>
          </View>
        </>
      )}
      {offer.canClaim ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onAct?.('claim')}
          style={[styles.action, { borderColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Claim</Text>
        </Pressable>
      ) : null}
      {offer.canMarkTaken ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onAct?.('taken')}
          style={[styles.action, { borderColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Mark as taken</Text>
        </Pressable>
      ) : null}
      {offer.canRelease ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onAct?.('release')}
          style={[styles.action, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.cardForeground }}>Release</Text>
        </Pressable>
      ) : null}
      {offer.canUnclaim ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onAct?.('unclaim')}
          style={[styles.action, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.cardForeground }}>Unclaim</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PollCard({ message, onAct }: CardProps) {
  const { theme } = useGochaTheme();
  const poll = message.post?.poll;
  if (!poll) return null;
  const max = Math.max(1, ...poll.options.map((option) => option.count));

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.cardForeground }]}>{poll.question}</Text>
      {poll.options.map((option) => (
        <Pressable
          key={option.id}
          disabled={poll.closed}
          onPress={() => onAct?.('vote', option.id)}
          style={[
            styles.option,
            {
              borderColor: option.selected ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}>
          <View
            style={[
              styles.optionFill,
              {
                width: `${Math.round((option.count / max) * 100)}%`,
                backgroundColor: option.selected ? theme.colors.primary : theme.colors.muted,
                opacity: 0.22,
              },
            ]}
          />
          <Text style={{ color: theme.colors.cardForeground, flex: 1 }}>{option.text}</Text>
          <Text style={{ color: theme.colors.mutedForeground }}>{option.count}</Text>
        </Pressable>
      ))}
      {poll.canClose ? (
        <Pressable onPress={() => onAct?.('close')} style={[styles.action, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.cardForeground }}>Close poll</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RsvpCard({ message, onAct }: CardProps) {
  const { theme } = useGochaTheme();
  const rsvp = message.post?.rsvp;
  if (!rsvp) return null;
  const choices: { id: keyof RsvpPost['counts']; label: string }[] = [
    { id: 'going', label: 'Going' },
    { id: 'maybe', label: 'Maybe' },
    { id: 'cant', label: "Can't go" },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.cardForeground }]}>{rsvp.title}</Text>
      {rsvp.when ? <Text style={{ color: theme.colors.mutedForeground }}>{rsvp.when}</Text> : null}
      {rsvp.where ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary }}>{rsvp.where}</Text>
        </View>
      ) : null}
      {choices.map((choice) => (
        <Pressable
          key={choice.id}
          disabled={rsvp.closed}
          onPress={() => onAct?.('vote', choice.id)}
          style={[
            styles.option,
            {
              borderColor: rsvp.myChoice === choice.id ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}>
          <Text style={{ color: theme.colors.cardForeground, flex: 1 }}>{choice.label}</Text>
          <Text style={{ color: theme.colors.mutedForeground }}>{rsvp.counts[choice.id]}</Text>
        </Pressable>
      ))}
      {rsvp.canClose ? (
        <Pressable onPress={() => onAct?.('close')} style={[styles.action, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.cardForeground }}>Close RSVP</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  cardTaken: {
    padding: 10,
  },
  hero: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#1B00D8',
  },
  takenRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  takenBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  takenHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  action: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  optionFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
