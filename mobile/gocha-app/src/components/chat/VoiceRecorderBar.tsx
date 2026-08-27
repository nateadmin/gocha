import { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

type Props = {
  onComplete: (durationSec: number) => void;
  onCancel: () => void;
};

export function VoiceRecorderBar({ onComplete, onCancel }: Props) {
  const { theme } = useGochaTheme();
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(true);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  function stop() {
    setRecording(false);
    if (seconds > 0) onComplete(seconds);
    else onCancel();
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}>
      <Pressable onPress={onCancel} hitSlop={8}>
        <Ionicons name="close" size={24} color={theme.colors.destructive} />
      </Pressable>
      <View style={styles.center}>
        <Ionicons name="mic" size={22} color={theme.colors.primary} />
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.mono,
            fontSize: 16,
          }}>
          {seconds}s
        </Text>
      </View>
      <Pressable onPress={stop} hitSlop={8}>
        <Ionicons name="send" size={24} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
