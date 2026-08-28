import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useGochaTheme } from '../../theme';

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2] as const;

type Props = {
  mediaUrl?: string;
  durationSec?: number;
  outgoing: boolean;
};

export function VoiceMessagePlayer({ mediaUrl, durationSec = 0, outgoing }: Props) {
  const { theme } = useGochaTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const playbackRate = PLAYBACK_SPEEDS[speedIndex];
  const iconColor = outgoing ? theme.colors.primaryForeground : theme.colors.primary;
  const labelColor = outgoing ? theme.colors.primaryForeground : theme.colors.cardForeground;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !mediaUrl) return;
    if (playing) {
      audio.pause();
      return;
    }
    void audio.play();
  }

  function cycleSpeed() {
    setSpeedIndex((value) => (value + 1) % PLAYBACK_SPEEDS.length);
  }

  if (!mediaUrl) {
    return (
      <View style={styles.row}>
        <Ionicons name="play" size={18} color={iconColor} />
        <Text style={{ color: labelColor, fontFamily: theme.typography.mono, fontSize: 13 }}>
          {durationSec}s
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={togglePlay} hitSlop={8} style={styles.playButton}>
        <Ionicons name={playing ? 'pause' : 'play'} size={18} color={iconColor} />
      </Pressable>

      <View style={styles.waveform}>
        {[...Array(12)].map((_, index) => (
          <View
            key={index}
            style={{
              width: 3,
              height: 6 + (index % 4) * 4,
              backgroundColor: playing ? iconColor : `${iconColor}88`,
              borderRadius: 2,
            }}
          />
        ))}
      </View>

      <Text style={{ color: labelColor, fontFamily: theme.typography.mono, fontSize: 13, minWidth: 28 }}>
        {durationSec}s
      </Text>

      <Pressable onPress={cycleSpeed} hitSlop={6} style={styles.speedButton}>
        <Text
          style={{
            color: labelColor,
            fontFamily: theme.typography.mono,
            fontSize: 12,
            fontWeight: '600',
          }}>
          {playbackRate}x
        </Text>
      </Pressable>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={mediaUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        style={{ display: 'none' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  speedButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
