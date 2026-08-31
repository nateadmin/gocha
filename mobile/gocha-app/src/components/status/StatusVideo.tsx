import { createElement } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  uri: string;
  paused?: boolean;
  controls?: boolean;
  caption?: string | null;
  videoRef?: { current: HTMLVideoElement | null };
};

export function StatusVideo({ uri, paused = false, controls = false, caption, videoRef }: Props) {
  if (typeof document !== 'undefined') {
    return createElement('video', {
      ref: (node: HTMLVideoElement | null) => {
        if (videoRef) {
          videoRef.current = node;
        }
      },
      src: uri,
      autoPlay: !paused && !controls,
      controls,
      playsInline: true,
      style: { width: '100%', height: '100%', objectFit: 'contain' },
    });
  }

  return (
    <View style={styles.fallback}>
      <Ionicons name="videocam" size={48} color="#fff" />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    gap: 12,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
