import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { emailSchema, type EmailFormValues } from '@/features/auth/schemas';
import { AuthHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: EmailFormValues) => {
    setError(null);
    try {
      await resetPassword(values.email.trim());
      setSent(true);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="md" />

        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your email and we&apos;ll send a password reset link using Supabase Auth.
          </Text>
        </View>

        {sent ? (
          <View style={styles.form}>
            <Text style={[styles.success, { color: Colors.secondary600 }]}>
              If an account exists for that email, a reset link is on the way. Check your inbox and
              spam folder.
            </Text>
            <Button title="Back to Login" onPress={() => router.replace(AuthHref.login)} />
          </View>
        ) : (
          <View style={styles.form}>
            <Controller
              control={form.control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={
                    typeof fieldState.error?.message === 'string'
                      ? fieldState.error.message
                      : undefined
                  }
                />
              )}
            />

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Button
              title="Send Reset Email"
              loading={isLoading}
              onPress={() => void form.handleSubmit(onSubmit)()}
            />
            <Button
              title="Back to Login"
              variant="ghost"
              onPress={() => router.replace(AuthHref.login)}
            />
          </View>
        )}

        <Pressable onPress={() => router.replace(AuthHref.welcome)} style={styles.welcomeLink}>
          <Text style={[styles.back, { color: theme.textSecondary }]}>Back to Welcome</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  hero: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
  form: {
    gap: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
  success: {
    ...Typography.body,
  },
  welcomeLink: {
    marginTop: 'auto',
    alignSelf: 'center',
  },
  back: {
    ...Typography.caption,
  },
});
