'use client';

import { Mic, Volume2 } from 'lucide-react';

import type { ChatSpeakable } from '@/domain/models/chatbot';
import { useTranslation } from '@/hooks/use-translation';
import { useWebVoice } from '@web/hooks/use-web-voice';
import { Button } from '@web/components/ui';

export function VoiceBar({
  lastSpeakable,
  onTranscript,
}: {
  lastSpeakable: ChatSpeakable | null;
  onTranscript: (text: string) => void;
}) {
  const { t } = useTranslation();
  const voice = useWebVoice();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {voice.status === 'listening' ? (
        <Button
          type="button"
          variant="warning"
          onClick={async () => {
            const text = await voice.stopListening();
            if (text) onTranscript(text);
          }}
        >
          {t('voice.stop')}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => void voice.startListening()}
        >
          <Mic size={16} />
          {t('voice.micA11y')}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        disabled={!lastSpeakable}
        onClick={() => void voice.speak(lastSpeakable)}
      >
        <Volume2 size={16} />
        {t('voice.speakA11y')}
      </Button>
      <span className="text-xs text-ink-muted">
        {voice.status === 'idle' ? '' : t(`voice.${voice.status}`) || voice.status}
        {voice.error ? ` · ${voice.error}` : ''}
      </span>
    </div>
  );
}
