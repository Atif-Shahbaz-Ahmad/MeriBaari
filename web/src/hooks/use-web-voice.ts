'use client';

import { useEffect, useRef, useState } from 'react';

import { getContainer } from '@/data';
import type { ChatSpeakable } from '@/domain/models/chatbot';
import type { VoiceSessionStatus } from '@/domain/models/voice';
import { toVoiceError } from '@/domain/errors/voice-error';
import { reportError } from '@/lib/monitoring';

export function useWebVoice() {
  const [status, setStatus] = useState<VoiceSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startListening() {
    setError(null);
    const permission = await getContainer().microphonePermissionService.requestPermission();
    if (permission !== 'granted') {
      setStatus('permission_denied');
      reportError(new Error('Microphone permission denied'), {
        feature: 'voice',
        provider: 'client',
        level: 'warning',
        tags: { code: 'permission_denied' },
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAt.current = Date.now();
      setStatus('listening');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Microphone failed');
      reportError(toVoiceError(e), {
        feature: 'voice',
        provider: 'client',
        tags: { code: 'unavailable' },
      });
    }
  }

  async function stopListening(): Promise<string | null> {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    setStatus('transcribing');
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () =>
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    const durationMs = Date.now() - startedAt.current;
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const audioBase64 = btoa(binary);
    try {
      const result = await getContainer().voiceService.transcribe({
        audioBase64,
        mimeType: blob.type || 'audio/webm',
        durationMs,
      });
      setStatus('idle');
      return result.transcript;
    } catch (e) {
      const mapped = toVoiceError(e);
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Voice failed');
      if (mapped.code !== 'no_speech') {
        reportError(mapped, {
          feature: 'voice',
          provider: 'deepgram',
          tags: { code: mapped.code },
        });
      }
      return null;
    }
  }

  async function speak(speakable: ChatSpeakable | null) {
    if (!speakable?.text) return;
    setStatus('speaking');
    try {
      const result = await getContainer().voiceService.speak({
        text: speakable.text,
        replyStyle: speakable.replyStyle,
      });
      if (!result) {
        setStatus('error');
        return;
      }
      const audio = new Audio(`data:${result.mimeType};base64,${result.audioBase64}`);
      await audio.play();
      setStatus('idle');
    } catch (e) {
      const mapped = toVoiceError(e);
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Playback failed');
      reportError(mapped, {
        feature: 'voice',
        provider: 'tts',
        tags: { code: mapped.code },
      });
    }
  }

  return { status, error, startListening, stopListening, speak, setStatus };
}
