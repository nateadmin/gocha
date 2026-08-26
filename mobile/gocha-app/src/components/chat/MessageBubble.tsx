import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ChatMessage } from '../../data/mock';
import { useGochaTheme } from '../../theme';

type Props = {
  message: ChatMessage;
};

export function MessageBubble({ message }: Props) {
  const { theme } = useGochaTheme();
  const outgoing = message.isOutgoing;

  return (
    <View style={[styles.wrap, outgoing ? styles.outgoing : styles.incoming]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: outgoing ? theme.colors.primary : theme.colors.muted,
            borderRadius: theme.radii.card,
          },
        ]}>
        <Text
          style={{
            color: outgoing
              ? theme.colors.primaryForeground
              : theme.colors.cardForeground,
            fontFamily: theme.typography.sans,
            fontSize: 16,
            lineHeight: 22,
          }}>
          {message.text}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.typography.sans,
            fontSize: 11,
          }}>
          {message.sentAt}
        </Text>
        {outgoing && message.status === 'read' ? (
          <Ionicons name="checkmark-done" size={14} color={theme.colors.secondary} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    maxWidth: '82%',
  },
  incoming: {
    alignSelf: 'flex-start',
  },
  outgoing: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
