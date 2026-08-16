import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { hasTranslationKey } from '@/lib/i18n';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, leftElement, rightElement, containerStyle, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rawError =
    typeof error === 'string' && error.trim() && error.trim() !== '{}'
      ? error.trim()
      : null;
  const errorText = rawError
    ? hasTranslationKey(rawError)
      ? t(rawError)
      : rawError
    : null;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: theme.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.input,
            borderColor: errorText ? Colors.error : theme.border,
          },
        ]}
      >
        {leftElement}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
        {rightElement}
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
      {!errorText && hint ? (
        <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs + 2,
  },
  label: {
    ...Typography.small,
  },
  field: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm + 4,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
  hint: {
    ...Typography.caption,
  },
});
