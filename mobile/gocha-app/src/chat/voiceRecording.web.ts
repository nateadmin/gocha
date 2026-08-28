import type { RecordedVoice, VoiceRecordingControls } from './voiceRecording';

export type { RecordedVoice, VoiceRecordingControls };

export async function createVoiceRecording(): Promise<VoiceRecordingControls | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  if (typeof MediaRecorder === 'undefined') {
    return null;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  let paused = false;
  let startMs = Date.now();
  let pausedTotalMs = 0;
  let pauseStartedMs: number | null = null;

  recorder.start(250);

  function elapsedMs(): number {
    const pauseExtra = pauseStartedMs ? Date.now() - pauseStartedMs : 0;
    return Math.max(0, Date.now() - startMs - pausedTotalMs - pauseExtra);
  }

  function releaseStream() {
    stream.getTracks().forEach((track) => track.stop());
  }

  return {
    pause() {
      if (paused || recorder.state !== 'recording') {
        return;
      }
      recorder.pause();
      paused = true;
      pauseStartedMs = Date.now();
    },
    resume() {
      if (!paused || recorder.state !== 'paused') {
        return;
      }
      recorder.resume();
      if (pauseStartedMs) {
        pausedTotalMs += Date.now() - pauseStartedMs;
      }
      pauseStartedMs = null;
      paused = false;
    },
    isPaused: () => paused,
    getElapsedSec: () => Math.floor(elapsedMs() / 1000),
    stop() {
      return new Promise<RecordedVoice>((resolve, reject) => {
        recorder.addEventListener(
          'stop',
          () => {
            releaseStream();
            const durationSec = Math.max(1, Math.round(elapsedMs() / 1000));
            const blob = new Blob(chunks, { type: mimeType });
            resolve({
              uri: URL.createObjectURL(blob),
              mimeType,
              durationSec,
            });
          },
          { once: true },
        );

        recorder.addEventListener(
          'error',
          () => {
            releaseStream();
            reject(new Error('Voice recording failed.'));
          },
          { once: true },
        );

        if (recorder.state === 'recording' || recorder.state === 'paused') {
          recorder.stop();
        } else {
          releaseStream();
          reject(new Error('Recorder was not active.'));
        }
      });
    },
    cancel() {
      releaseStream();
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    },
  };
}
