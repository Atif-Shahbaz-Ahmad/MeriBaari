import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';

import { getContainer } from '@/data';
import {
  VoiceError,
  getVoiceErrorCopyKey,
  getVoiceErrorMessage,
  toVoiceError,
} from '@/domain/errors/voice-error';
import type { ChatSpeakable } from '@/domain/models/chatbot';
import type { ReplyStyle } from '@/domain/models/reply-style';
import type { VoiceSessionStatus } from '@/domain/models/voice';
import {
  VOICE_COOLDOWN_MS,
  VOICE_MAX_DURATION_MS,
  VOICE_MIN_DURATION_MS,
} from '@/domain/services/voice.service';
import { getVoiceCopy } from '@/features/voice/copy';
import {
  deleteLocalRecording,
  readRecordingAsBase64,
  writeTempTtsAudio,
} from '@/features/voice/local-audio';
import { VOICE_RECORDING_MIME, VOICE_RECORDING_OPTIONS } from '@/features/voice/recording-options';
import { playTtsFile, stopTtsPlayback } from '@/features/voice/tts-playback';
import { useTranslation } from '@/hooks/use-translation';
import { reportError } from '@/lib/monitoring';

const isNativeVoice = Platform.OS === 'ios' || Platform.OS === 'android';
const TTS_CACHE_LIMIT = 3;

type TtsCacheEntry = {
  key: string;
  audioBase64: string;
  mimeType: string;
};

type UseVoiceSessionOptions = {
  /** Existing chatbot send — customer or business. Never confirm actions. */
  sendText: (transcript: string) => Promise<ChatSpeakable | void> | ChatSpeakable | void;
  canUse: boolean;
  isSending: boolean;
};

export function useVoiceSession({ sendText, canUse, isSending }: UseVoiceSessionOptions) {
  const { t, language } = useTranslation();
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);

  const [status, setStatus] = useState<VoiceSessionStatus>('idle');
  const [errorCode, setErrorCode] = useState<VoiceError['code'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const [replyStyle, setReplyStyle] = useState<ReplyStyle | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsFailedMessageId, setTtsFailedMessageId] = useState<string | null>(null);

  const finishing = useRef(false);
  const lastStartedAt = useRef(0);
  const autoStopArmed = useRef(false);
  const speakGen = useRef(0);
  const lastSpeakable = useRef<ChatSpeakable | null>(null);
  const autoSpoken = useRef(new Set<string>());
  const ttsCache = useRef<TtsCacheEntry[]>([]);

  const active = status !== 'idle';
  const voiceBusy =
    status === 'listening' ||
    status === 'transcribing' ||
    status === 'processing' ||
    status === 'speaking' ||
    isSending;

  const copy = useCallback(
    (key: string) => getVoiceCopy(t, key, { language, replyStyle }),
    [t, language, replyStyle],
  );

  const resetIdle = useCallback(() => {
    finishing.current = false;
    autoStopArmed.current = false;
    setStatus('idle');
    setErrorCode(null);
    setErrorMessage(null);
    setTranscriptPreview(null);
    setTtsLoading(false);
    setSpeakingMessageId(null);
  }, []);

  const haptic = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* ignore */
    }
  }, []);

  const fail = useCallback(
    (error: unknown) => {
      const mapped = toVoiceError(error);
      finishing.current = false;
      autoStopArmed.current = false;
      setTranscriptPreview(null);
      setTtsLoading(false);
      setSpeakingMessageId(null);
      setErrorCode(mapped.code);
      setErrorMessage(
        copy(getVoiceErrorCopyKey(mapped.code).replace('voice.', '')) ||
          getVoiceErrorMessage(mapped),
      );
      setStatus(mapped.code === 'permission_denied' ? 'permission_denied' : 'error');
      if (mapped.code !== 'no_speech') {
        reportError(mapped, {
          feature: 'voice',
          provider: 'client',
          level: mapped.code === 'permission_denied' ? 'warning' : 'error',
          tags: { platform: 'mobile', code: mapped.code },
        });
      }
    },
    [copy],
  );

  const cacheGet = useCallback((text: string, style: ReplyStyle) => {
    const key = `${style}:${text}`;
    return ttsCache.current.find((entry) => entry.key === key) ?? null;
  }, []);

  const cacheSet = useCallback(
    (text: string, style: ReplyStyle, audioBase64: string, mimeType: string) => {
      const key = `${style}:${text}`;
      ttsCache.current = [
        { key, audioBase64, mimeType },
        ...ttsCache.current.filter((entry) => entry.key !== key),
      ].slice(0, TTS_CACHE_LIMIT);
    },
    [],
  );

  const stopSpeaking = useCallback(() => {
    speakGen.current += 1;
    stopTtsPlayback();
    setTtsLoading(false);
    setSpeakingMessageId(null);
    finishing.current = false;
    autoStopArmed.current = false;
    setStatus('idle');
    setErrorCode(null);
    setErrorMessage(null);
    setTranscriptPreview(null);
  }, []);

  const speakAssistant = useCallback(
    async (item: ChatSpeakable, options?: { replay?: boolean }) => {
      if (!isNativeVoice) return;
      const replay = options?.replay === true;
      if (!replay && autoSpoken.current.has(item.messageId)) return;
      if (!item.text.trim()) return;

      speakGen.current += 1;
      const gen = speakGen.current;
      stopTtsPlayback();

      lastSpeakable.current = item;
      if (!replay) autoSpoken.current.add(item.messageId);

      setTtsErrorMessage(null);
      setTtsFailedMessageId(null);
      setSpeakingMessageId(item.messageId);
      setReplyStyle(item.replyStyle);
      setTtsLoading(true);
      setStatus('speaking');
      setErrorCode(null);
      setErrorMessage(null);

      try {
        let clip = cacheGet(item.text, item.replyStyle);
        if (!clip) {
          const result = await getContainer().voiceService.speak({
            text: item.text,
            replyStyle: item.replyStyle,
          });
          if (gen !== speakGen.current) return;
          if (!result) {
            setTtsLoading(false);
            setSpeakingMessageId(null);
            setStatus('idle');
            return;
          }
          clip = {
            key: `${item.replyStyle}:${item.text}`,
            audioBase64: result.audioBase64,
            mimeType: result.mimeType,
          };
          cacheSet(item.text, item.replyStyle, result.audioBase64, result.mimeType);
        }

        if (gen !== speakGen.current) return;

        const uri = writeTempTtsAudio(clip.audioBase64, clip.mimeType);
        setTtsLoading(false);
        await playTtsFile(uri);
        if (gen !== speakGen.current) return;
        setSpeakingMessageId(null);
        setStatus('idle');
      } catch (error) {
        if (gen !== speakGen.current) return;
        stopTtsPlayback();
        const mapped = toVoiceError(error);
        const message =
          mapped.code === 'rate_limited'
            ? copy('errors.rate_limited')
            : copy('playbackUnavailable') || "Voice playback isn't available right now.";
        setTtsErrorMessage(message);
        setTtsFailedMessageId(item.messageId);
        setTtsLoading(false);
        setSpeakingMessageId(null);
        setStatus('idle');
        reportError(mapped, {
          feature: 'voice',
          provider: 'tts',
          tags: { platform: 'mobile', code: mapped.code },
        });
      }
    },
    [cacheGet, cacheSet, copy],
  );

  const replayLast = useCallback(() => {
    const item = lastSpeakable.current;
    if (!item) return;
    void speakAssistant(item, { replay: true });
  }, [speakAssistant]);

  const transcribeUri = useCallback(
    async (uri: string, durationMs: number) => {
      setStatus('transcribing');
      setErrorCode(null);
      setErrorMessage(null);

      try {
        if (durationMs < VOICE_MIN_DURATION_MS) {
          throw new VoiceError('no_speech', 'I did not catch that. Please try speaking again.');
        }

        const { audioBase64 } = await readRecordingAsBase64(uri);
        const result = await getContainer().voiceService.transcribe({
          audioBase64,
          mimeType: VOICE_RECORDING_MIME,
          durationMs,
        });

        setReplyStyle(result.replyStyle);
        setTranscriptPreview(result.transcript);
        setStatus('processing');
        const spoken = await sendText(result.transcript);
        if (spoken && spoken.text) {
          await speakAssistant(spoken);
        } else {
          resetIdle();
        }
      } catch (error) {
        fail(error);
      } finally {
        deleteLocalRecording(uri);
        finishing.current = false;
      }
    },
    [fail, resetIdle, sendText, speakAssistant],
  );

  const stopAndTranscribe = useCallback(async () => {
    if (finishing.current) return;
    if (status !== 'listening') return;
    finishing.current = true;
    autoStopArmed.current = false;
    await haptic();

    try {
      const durationMs = recorder.getStatus().durationMillis;
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) {
        throw new VoiceError('no_speech', 'I did not catch that. Please try speaking again.');
      }
      await transcribeUri(uri, durationMs);
    } catch (error) {
      deleteLocalRecording(recorder.uri);
      fail(error);
    }
  }, [fail, haptic, recorder, status, transcribeUri]);

  const cancelListening = useCallback(async () => {
    if (status !== 'listening') return;
    finishing.current = true;
    autoStopArmed.current = false;
    await haptic();
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
    } catch {
      /* ignore */
    }
    deleteLocalRecording(recorder.uri);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(
      () => undefined,
    );
    resetIdle();
  }, [haptic, recorder, resetIdle, status]);

  const startListening = useCallback(async () => {
    if (!isNativeVoice) {
      fail(new VoiceError('unsupported_platform', 'Voice is not available on this device.', false));
      return;
    }
    if (!canUse || voiceBusy || finishing.current) return;
    if (Date.now() - lastStartedAt.current < VOICE_COOLDOWN_MS) return;

    Keyboard.dismiss();
    setErrorCode(null);
    setErrorMessage(null);
    setTranscriptPreview(null);
    setTtsErrorMessage(null);

    const permission = await getContainer().microphonePermissionService.requestPermission();
    if (permission !== 'granted') {
      setStatus('permission_denied');
      setErrorCode('permission_denied');
      setErrorMessage(copy('errors.permission_denied'));
      return;
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      finishing.current = false;
      autoStopArmed.current = true;
      lastStartedAt.current = Date.now();
      recorder.record({ forDuration: VOICE_MAX_DURATION_MS / 1000 });
      setStatus('listening');
      await haptic();
    } catch (error) {
      autoStopArmed.current = false;
      deleteLocalRecording(recorder.uri);
      fail(error);
    }
  }, [canUse, copy, fail, haptic, recorder, voiceBusy]);

  useEffect(() => {
    if (status !== 'listening' || !autoStopArmed.current || finishing.current) return;
    if (recorderState.durationMillis < VOICE_MAX_DURATION_MS) return;
    void stopAndTranscribe();
  }, [recorderState.durationMillis, status, stopAndTranscribe]);

  useEffect(() => {
    return () => {
      speakGen.current += 1;
      stopTtsPlayback();
    };
  }, []);

  const toggle = useCallback(() => {
    if (status === 'speaking') {
      stopSpeaking();
      return;
    }
    if (status === 'listening') {
      void stopAndTranscribe();
      return;
    }
    if (status === 'error' || status === 'permission_denied' || status === 'idle') {
      void startListening();
    }
  }, [startListening, status, stopAndTranscribe, stopSpeaking]);

  const retry = useCallback(() => {
    if (voiceBusy) return;
    void startListening();
  }, [startListening, voiceBusy]);

  const openSettings = useCallback(() => {
    void getContainer().microphonePermissionService.openSystemSettings();
  }, []);

  const dismissError = useCallback(() => {
    if (status === 'error' || status === 'permission_denied') {
      resetIdle();
    }
  }, [resetIdle, status]);

  const dismissTtsError = useCallback(() => {
    setTtsErrorMessage(null);
    setTtsFailedMessageId(null);
  }, []);

  return {
    visible: isNativeVoice,
    status,
    errorCode,
    errorMessage,
    transcriptPreview,
    elapsedMs: status === 'listening' ? recorderState.durationMillis : 0,
    metering: recorderState.metering ?? null,
    active,
    voiceBusy,
    ttsLoading,
    ttsErrorMessage,
    speakingMessageId,
    ttsFailedMessageId,
    copy,
    startListening,
    stopAndTranscribe,
    cancelListening,
    stopSpeaking,
    speakAssistant,
    replayLast,
    toggle,
    retry,
    openSettings,
    dismissError,
    dismissTtsError,
  };
}

export function isVoicePlatformSupported(): boolean {
  return isNativeVoice;
}
