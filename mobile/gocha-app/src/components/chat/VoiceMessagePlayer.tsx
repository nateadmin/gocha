import { Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  mediaUrl?: string;
  durationSec?: number;
  outgoing: boolean;
};

/** Native fallback when no web audio element is available. */
export function VoiceMessagePlayer({ mediaUrl, durationSec = 0, outgoing }: Props) {
  const { theme } = useGochaTheme();
  const iconColor = outgoing ? theme.colors.primaryForeground : theme.colors.primary;
  const labelColor = outgoing ? theme.colors.primaryForeground : theme.colors.cardForeground;

  return (
    <View style={styles.row}>
      <Ionicons name="play" size={18} color={iconColor} />
      <View style={styles.waveform}>
        {[...Array(12)].map((_, index) => (
          <View
            key={index}
            style={{
              width: 3,
              height: 6 + (index % 4) * 4,
              backgroundColor: iconColor,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
      <Text style={{ color: labelColor, fontFamily: theme.typography.mono, fontSize: 13 }}>
        {mediaUrl ? `${durationSec}s` : 'Voice note'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
});
