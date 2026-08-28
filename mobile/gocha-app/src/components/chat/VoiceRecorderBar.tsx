import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { createVoiceRecording, type RecordedVoice } from '../../chat/voiceRecording';
import { useGochaTheme } from '../../theme';

type Props = {
  onComplete: (voice: RecordedVoice) => void;
  onCancel: () => void;
};

type TimerFallback = {
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  getElapsedSec: () => number;
  stop: () => RecordedVoice;
  cancel: () => void;
};

function createTimerFallback(): TimerFallback {
  let paused = false;
  let startMs = Date.now();
  let pausedTotalMs = 0;
  let pauseStartedMs: number | null = null;

  function elapsedMs() {
    const pauseExtra = pauseStartedMs ? Date.now() - pauseStartedMs : 0;
    return Math.max(0, Date.now() - startMs - pausedTotalMs - pauseExtra);
  }

  return {
    pause() {
      if (paused) return;
      paused = true;
      pauseStartedMs = Date.now();
    },
    resume() {
      if (!paused) return;
      if (pauseStartedMs) {
        pausedTotalMs += Date.now() - pauseStartedMs;
      }
      pauseStartedMs = null;
      paused = false;
    },
    isPaused: () => paused,
    getElapsedSec: () => Math.floor(elapsedMs() / 1000),
    stop() {
      return {
        uri: '',
        mimeType: 'audio/webm',
        durationSec: Math.max(1, Math.round(elapsedMs() / 1000)),
      };
    },
    cancel() {},
  };
}

type RecordingSession = Awaited<ReturnType<typeof createVoiceRecording>> | TimerFallback;

export function VoiceRecorderBar({ onComplete, onCancel }: Props) {
  const { theme } = useGochaTheme();
  const controlsRef = useRef<RecordingSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    createVoiceRecording()
      .then((controls) => {
        if (!active) {
          controls?.cancel();
          return;
        }
        if (!controls && Platform.OS === 'web') {
          onCancel();
          return;
        }
        controlsRef.current = controls ?? createTimerFallback();
        setReady(true);
        timer = setInterval(() => {
          const session = controlsRef.current;
          if (!session) return;
          setSeconds(session.getElapsedSec());
          setPaused(session.isPaused());
        }, 200);
      })
      .catch(() => {
        if (active) {
          onCancel();
        }
      });

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      controlsRef.current?.cancel();
      controlsRef.current = null;
    };
  }, [onCancel]);

  function togglePause() {
    const session = controlsRef.current;
    if (!session) return;
    if (session.isPaused()) {
      session.resume();
      setPaused(false);
      return;
    }
    session.pause();
    setPaused(true);
  }

  async function sendRecording() {
    const session = controlsRef.current;
    if (!session || sending) return;
    setSending(true);
    try {
      const voice = await Promise.resolve(session.stop());
      if (!voice.uri && Platform.OS === 'web') {
        onCancel();
        return;
      }
      controlsRef.current = null;
      onComplete(voice);
    } catch {
      onCancel();
    } finally {
      setSending(false);
    }
  }

  function cancelRecording() {
    controlsRef.current?.cancel();
    controlsRef.current = null;
    onCancel();
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
      <Pressable onPress={cancelRecording} hitSlop={8} disabled={sending}>
        <Ionicons name="close" size={24} color={theme.colors.destructive} />
      </Pressable>

      <Pressable
        onPress={togglePause}
        hitSlop={8}
        disabled={!ready || sending}
        style={styles.pauseButton}>
        <Ionicons
          name={paused ? 'play' : 'pause'}
          size={22}
          color={theme.colors.primary}
        />
      </Pressable>

      <View style={styles.center}>
        <Ionicons
          name="mic"
          size={22}
          color={paused ? theme.colors.mutedForeground : theme.colors.primary}
        />
        <Text
          style={{
            color: theme.colors.cardForeground,
            fontFamily: theme.typography.mono,
            fontSize: 16,
          }}>
          {seconds}s
        </Text>
        {paused ? (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.typography.sans,
              fontSize: 12,
            }}>
            Paused
          </Text>
        ) : null}
      </View>

      <Pressable onPress={sendRecording} hitSlop={8} disabled={!ready || sending || seconds < 1}>
        <Ionicons
          name="send"
          size={24}
          color={seconds >= 1 ? theme.colors.primary : theme.colors.mutedForeground}
        />
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
    gap: 8,
  },
  pauseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
