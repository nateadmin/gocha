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

/** Native stub: real microphone capture is web-only for now. */
export async function createVoiceRecording(): Promise<VoiceRecordingControls | null> {
  return null;
}
