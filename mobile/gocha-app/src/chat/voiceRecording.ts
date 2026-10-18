export type RecordedVoice = {
  uri: string;
  mimeType: string;
  durationSec: number;
};

export type VoiceRecordingControls = {
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  getElapsedSec: () => number;
  stop: () => Promise<RecordedVoice>;
  cancel: () => void;
};

/** Native has no microphone recorder linked yet, so the mic button is hidden. */
export const VOICE_RECORDING_SUPPORTED = false;

/** Native stub: real microphone capture is web-only for now. */
export async function createVoiceRecording(): Promise<VoiceRecordingControls | null> {
  return null;
}
