import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bot, RefreshCw, Volume2 } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type ChatMessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  retryable?: boolean;
  retryDisabled?: boolean;
  onRetry?: () => void;
  speakable?: boolean;
  speaking?: boolean;
  ttsLoading?: boolean;
  ttsError?: boolean;
  ttsErrorMessage?: string | null;
  onSpeak?: () => void;
  speakA11y?: string;
};

export function ChatMessageBubble({
  role,
  content,
  error,
  retryable,
  retryDisabled,
  onRetry,
  speakable,
  speaking,
  ttsLoading,
  ttsError,
  ttsErrorMessage,
  onSpeak,
  speakA11y,
}: ChatMessageBubbleProps) {
  const theme = useTheme();
  const { t, isRTL } = useTranslation();
  const isUser = role === 'user';

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowAssistant,
        isRTL && isUser ? styles.rowUserRtl : null,
      ]}
    >
      {!isUser ? (
        <View style={[styles.avatar, { backgroundColor: theme.tints.primary.bg }]}>
          <Bot size={16} color={theme.tints.primary.fg} strokeWidth={2} />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser
            ? styles.userBubble
            : {
                backgroundColor: error ? theme.tints.error.bg : theme.card,
                borderColor: error ? theme.tints.error.border : theme.border,
              },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? Colors.textInverse : error ? theme.tints.error.fg : theme.text },
          ]}
        >
          {content}
        </Text>
        {error && retryable ? (
          <Pressable
            onPress={onRetry}
            disabled={retryDisabled}
            style={[styles.retry, retryDisabled && styles.retryDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('common.retry')}
            accessibilityState={{ disabled: Boolean(retryDisabled), busy: Boolean(retryDisabled) }}
          >
            {retryDisabled ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <RefreshCw size={14} color={Colors.primary} strokeWidth={2} />
            )}
            <Text style={styles.retryLabel}>{t('common.retry')}</Text>
          </Pressable>
        ) : null}
        {speakable && !error ? (
          <View style={styles.speakRow}>
            <Pressable
              onPress={onSpeak}
              disabled={ttsLoading && !speaking}
              style={styles.speakBtn}
              accessibilityRole="button"
              accessibilityLabel={speakA11y ?? t('voice.speakA11y')}
            >
              {ttsLoading && speaking ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Volume2
                  size={16}
                  color={speaking ? Colors.primary : theme.textSecondary}
                  strokeWidth={speaking ? 2.4 : 2}
                />
              )}
            </Pressable>
            {ttsError ? (
              <Pressable onPress={onSpeak} accessibilityRole="button">
                <Text style={[styles.ttsHint, { color: theme.textSecondary }]}>
                  {ttsErrorMessage ?? t('voice.playbackUnavailable')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ChatTypingIndicator() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.row, styles.rowAssistant]}>
      <View style={[styles.avatar, { backgroundColor: theme.tints.primary.bg }]}>
        <Bot size={16} color={theme.tints.primary.fg} strokeWidth={2} />
      </View>
      <View
        style={[
          styles.bubble,
          styles.typingBubble,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        accessibilityLabel={t('chatbot.typing')}
      >
        <ActivityIndicator size="small" color={theme.tints.primary.fg} />
        <Text style={[styles.typingText, { color: theme.textSecondary }]}>
          {t('chatbot.typing')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowUserRtl: {
    justifyContent: 'flex-start',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary600,
  },
  text: {
    ...Typography.body,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  retryDisabled: {
    opacity: 0.6,
  },
  retryLabel: {
    ...Typography.small,
    color: Colors.primary,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingText: {
    ...Typography.small,
  },
  speakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  speakBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttsHint: {
    ...Typography.small,
    flex: 1,
  },
});
