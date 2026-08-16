import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { VoiceSessionStatus } from '@/domain/models/voice';
import { VOICE_MAX_DURATION_MS } from '@/domain/services/voice.service';
import { useTheme } from '@/hooks/use-theme';

type VoiceSessionBarProps = {
  status: VoiceSessionStatus;
  elapsedMs: number;
  transcriptPreview: string | null;
  errorMessage: string | null;
  ttsLoading?: boolean;
  ttsErrorMessage?: string | null;
  copy: (key: string) => string;
  onStop: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onReplay?: () => void;
  onOpenSettings: () => void;
  onDismissError: () => void;
  onDismissTtsError?: () => void;
};

export function VoiceSessionBar({
  status,
  elapsedMs,
  transcriptPreview,
  errorMessage,
  ttsLoading,
  ttsErrorMessage,
  copy,
  onStop,
  onCancel,
  onRetry,
  onReplay,
  onOpenSettings,
  onDismissError,
  onDismissTtsError,
}: VoiceSessionBarProps) {
  const theme = useTheme();

  if (status === 'idle' && !ttsErrorMessage) return null;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      {status === 'listening' ? (
        <ListeningRow
          elapsedMs={elapsedMs}
          label={copy('listening')}
          stopLabel={copy('stop')}
          cancelLabel={copy('cancel')}
          onStop={onStop}
          onCancel={onCancel}
        />
      ) : null}

      {status === 'transcribing' ? (
        <StatusRow
          color={Colors.primary}
          title={copy('transcribing')}
          detail={transcriptPreview}
        />
      ) : null}

      {status === 'processing' ? (
        <StatusRow
          color={Colors.primary}
          title={copy('processing')}
          detail={transcriptPreview}
        />
      ) : null}

      {status === 'speaking' ? (
        ttsLoading ? (
          <StatusRow color={Colors.primary} title={copy('preparing')} detail={null} />
        ) : (
          <SpeakingRow
            label={copy('speaking')}
            stopLabel={copy('stopSpeaking')}
            onStop={onStop}
          />
        )
      ) : null}

      {status === 'permission_denied' ? (
        <ErrorBlock
          title={copy('permissionTitle')}
          body={errorMessage ?? copy('permissionBody')}
          primary={copy('openSettings')}
          secondary={copy('cancel')}
          onPrimary={onOpenSettings}
          onSecondary={onDismissError}
        />
      ) : null}

      {status === 'error' ? (
        <ErrorBlock
          title={errorMessage ?? copy('errors.unknown')}
          body={transcriptPreview}
          primary={copy('retry')}
          secondary={copy('cancel')}
          onPrimary={onRetry}
          onSecondary={onDismissError}
        />
      ) : null}

      {status === 'idle' && ttsErrorMessage ? (
        <ErrorBlock
          title={ttsErrorMessage}
          body={null}
          primary={copy('retry')}
          secondary={copy('cancel')}
          onPrimary={() => onReplay?.()}
          onSecondary={() => onDismissTtsError?.()}
        />
      ) : null}
    </View>
  );
}

function ListeningRow({
  elapsedMs,
  label,
  stopLabel,
  cancelLabel,
  onStop,
  onCancel,
}: {
  elapsedMs: number;
  label: string;
  stopLabel: string;
  cancelLabel: string;
  onStop: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + (pulse.value - 1) * 1.4,
  }));

  const remaining = Math.max(0, VOICE_MAX_DURATION_MS - elapsedMs);
  const seconds = Math.ceil(remaining / 1000);

  return (
    <View style={styles.row}>
      <View style={styles.live}>
        <View style={styles.dotWrap}>
          <Animated.View style={[styles.pulse, pulseStyle, { backgroundColor: Colors.error }]} />
          <View style={[styles.dot, { backgroundColor: Colors.error }]} />
        </View>
        <View style={styles.liveText}>
          <Text style={[styles.title, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {seconds}s
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={cancelLabel}>
          <Text style={[styles.link, { color: theme.textSecondary }]}>{cancelLabel}</Text>
        </Pressable>
        <Button
          title={stopLabel}
          onPress={onStop}
          size="sm"
          variant="danger"
          fullWidth={false}
          style={styles.stop}
        />
      </View>
    </View>
  );
}

function SpeakingRow({
  label,
  stopLabel,
  onStop,
}: {
  label: string;
  stopLabel: string;
  onStop: () => void;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + (pulse.value - 1) * 1.4,
  }));

  return (
    <View style={styles.row}>
      <View style={styles.live}>
        <View style={styles.dotWrap}>
          <Animated.View style={[styles.pulse, pulseStyle, { backgroundColor: Colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
        </View>
        <View style={styles.liveText}>
          <Text style={[styles.title, { color: theme.text }]}>{label}</Text>
        </View>
      </View>
      <Button
        title={stopLabel}
        onPress={onStop}
        size="sm"
        variant="danger"
        fullWidth={false}
        style={styles.stop}
      />
    </View>
  );
}

function StatusRow({
  color,
  title,
  detail,
}: {
  color: string;
  title: string;
  detail: string | null;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stack}>
      <Text style={[styles.title, { color }]}>{title}</Text>
      {detail ? (
        <Text style={[styles.preview, { color: theme.text }]} numberOfLines={3}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

function ErrorBlock({
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  title: string;
  body: string | null;
  primary: string;
  secondary: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stack}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {body ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{body}</Text>
      ) : null}
      <View style={styles.errorActions}>
        <Button
          title={primary}
          onPress={onPrimary}
          size="sm"
          variant="primary"
          fullWidth={false}
          style={styles.errorBtn}
        />
        <Button
          title={secondary}
          onPress={onSecondary}
          size="sm"
          variant="secondary"
          fullWidth={false}
          style={styles.errorBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  live: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  liveText: {
    flex: 1,
    gap: 2,
  },
  dotWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.small,
  },
  preview: {
    ...Typography.body,
  },
  link: {
    ...Typography.small,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stop: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  stack: {
    gap: Spacing.xs,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorBtn: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
});
