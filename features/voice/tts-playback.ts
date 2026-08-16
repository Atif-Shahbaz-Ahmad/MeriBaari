import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

import { deleteLocalRecording } from '@/features/voice/local-audio';

type PlaybackHandle = {
  player: AudioPlayer;
  uri: string;
  subscription: { remove(): void };
  settle: () => void;
};

let active: PlaybackHandle | null = null;

export async function playTtsFile(uri: string): Promise<void> {
  stopTtsPlayback();
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });

  await new Promise<void>((resolve, reject) => {
    const player = createAudioPlayer({ uri }, { updateInterval: 250 });
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safety);
      resolve();
    };
    const safety = setTimeout(done, 45_000);
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) done();
    });
    active = {
      player,
      uri,
      subscription,
      settle: done,
    };
    try {
      player.play();
    } catch (error) {
      settled = true;
      clearTimeout(safety);
      cleanupPlayback();
      reject(error);
    }
  });

  cleanupPlayback();
}

export function stopTtsPlayback(): void {
  const current = active;
  current?.settle();
  cleanupPlayback();
}

function cleanupPlayback(): void {
  const current = active;
  active = null;
  if (!current) return;
  try {
    current.subscription.remove();
  } catch {
    /* ignore */
  }
  try {
    current.player.pause();
  } catch {
    /* ignore */
  }
  try {
    current.player.remove();
  } catch {
    /* ignore */
  }
  deleteLocalRecording(current.uri);
}
