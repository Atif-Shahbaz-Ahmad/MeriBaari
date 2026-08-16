import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Send } from 'lucide-react-native';

import { VoiceMicButton } from '@/components/voice/VoiceMicButton';
import { VoiceSessionBar } from '@/components/voice/VoiceSessionBar';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { VoiceSessionStatus } from '@/domain/models/voice';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export type ChatComposerVoice = {
  visible: boolean;
  status: VoiceSessionStatus;
  elapsedMs: number;
  transcriptPreview: string | null;
  errorMessage: string | null;
  ttsLoading?: boolean;
  ttsErrorMessage?: string | null;
  copy: (key: string) => string;
  toggle: () => void;
  stopAndTranscribe: () => void;
  cancelListening: () => void;
  stopSpeaking?: () => void;
  replayLast?: () => void;
  retry: () => void;
  openSettings: () => void;
  dismissError: () => void;
  dismissTtsError?: () => void;
};

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
  maxLength: number;
  placeholder?: string;
  sendA11y?: string;
  typingLabel?: string;
  voice?: ChatComposerVoice;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  sending,
  maxLength,
  placeholder,
  sendA11y,
  typingLabel,
  voice,
}: ChatComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const voiceActive = Boolean(voice && voice.status !== 'idle');
  const inputLocked = disabled || sending || voiceActive;
  const canSend = !inputLocked && value.trim().length > 0;
  const placeholderText = placeholder ?? t('chatbot.placeholder');
  const sendLabel = sending
    ? (typingLabel ?? t('chatbot.typing'))
    : (sendA11y ?? t('chatbot.sendA11y'));

  return (
    <View>
      {voice?.visible && (voice.status !== 'idle' || Boolean(voice.ttsErrorMessage)) ? (
        <VoiceSessionBar
          status={voice.status}
          elapsedMs={voice.elapsedMs}
          transcriptPreview={voice.transcriptPreview}
          errorMessage={voice.errorMessage}
          ttsLoading={voice.ttsLoading}
          ttsErrorMessage={voice.ttsErrorMessage}
          copy={voice.copy}
          onStop={() => {
            if (voice.status === 'speaking') {
              voice.stopSpeaking?.();
              return;
            }
            void voice.stopAndTranscribe();
          }}
          onCancel={() => void voice.cancelListening()}
          onRetry={voice.retry}
          onReplay={voice.replayLast}
          onOpenSettings={voice.openSettings}
          onDismissError={voice.dismissError}
          onDismissTtsError={voice.dismissTtsError}
        />
      ) : null}
      <View
        style={[
          styles.bar,
          { backgroundColor: theme.card, borderTopColor: theme.border },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholderText}
          placeholderTextColor={theme.textMuted}
          editable={!inputLocked}
          maxLength={maxLength}
          multiline
          style={[styles.input, { color: theme.text, backgroundColor: theme.input }]}
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          blurOnSubmit={false}
          showSoftInputOnFocus={!voiceActive}
          accessibilityLabel={placeholderText}
        />
        {voice?.visible ? (
          <VoiceMicButton
            status={voice.status}
            disabled={disabled || sending}
            accessibilityLabel={voice.copy('micA11y')}
            onPress={voice.toggle}
          />
        ) : null}
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          style={[
            styles.send,
            { backgroundColor: canSend || sending ? Colors.primary : theme.border },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Send size={18} color={Colors.textInverse} strokeWidth={2} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
