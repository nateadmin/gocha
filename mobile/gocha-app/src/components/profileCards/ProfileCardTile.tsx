import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ProfileCardSummary } from '../../api/client';
import { cardActionLabel, profileCardIcon, visibilityLabel } from '../../profileCards/profileCardMeta';
import { useGochaTheme } from '../../theme';

type Props = {
  card: ProfileCardSummary;
  onPressAction?: () => void;
  actionLoading?: boolean;
};

export function ProfileCardTile({ card, onPressAction, actionLoading }: Props) {
  const { theme } = useGochaTheme();
  const action = cardActionLabel(card);
  const locked = !card.canView;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.card,
        },
      ]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.muted }]}>
          <Ionicons name={profileCardIcon(card.type)} size={22} color={theme.colors.mutedForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.cardForeground,
              fontFamily: theme.typography.sans,
              fontSize: 17,
              fontWeight: '600',
            }}>
            {card.title}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={locked ? 'lock-closed' : 'lock-open-outline'}
              size={12}
              color={theme.colors.mutedForeground}
            />
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.typography.sans,
                fontSize: 13,
              }}>
              {visibilityLabel(card.visibility)}
            </Text>
          </View>
        </View>
      </View>

      {action ? (
        Platform.OS === 'web' ? (
          <button
            type="button"
            disabled={actionLoading || action === 'Request pending'}
            onClick={onPressAction}
            style={{
              width: '100%',
              marginTop: 14,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 10,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.cardForeground,
              fontSize: 15,
              cursor: action === 'Request pending' ? 'default' : 'pointer',
              opacity: actionLoading ? 0.6 : 1,
            }}>
            {actionLoading ? 'Working…' : action}
          </button>
        ) : (
          <Pressable
            disabled={actionLoading || action === 'Request pending'}
            onPress={onPressAction}
            style={[
              styles.action,
              {
                borderColor: theme.colors.border,
                opacity: actionLoading ? 0.6 : 1,
              },
            ]}>
            <Text style={{ color: theme.colors.cardForeground, fontFamily: theme.typography.sans, fontSize: 15 }}>
              {actionLoading ? 'Working…' : action}
            </Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  action: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
