import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeroLayout } from '@/components/auth/AuthHeroLayout';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas';
import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

/**
 * Set a new password after opening a Supabase recovery deep link.
 * Requires an authenticated recovery session (`passwordRecoveryPending`).
 */
export default function ResetPasswordScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const {
    updatePassword,
    isLoading,
    isAuthenticated,
    passwordRecoveryPending,
    role,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!isAuthenticated) {
    return <Redirect href={AuthHref.forgotPassword} />;
  }

  if (!passwordRecoveryPending && !done) {
    return <Redirect href={getHomeHref(role)} />;
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null);
    try {
      await updatePassword(values.password);
      setDone(true);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  };

  const onContinue = () => {
    const state = useAuthStore.getState();
    if (state.session && state.role) {
      router.replace(getHomeHref(state.role));
      return;
    }
    if (state.session && !state.role) {
      router.replace(AuthHref.roleSelect);
      return;
    }
    router.replace(AuthHref.login);
  };

  return (
    <AuthHeroLayout>
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="sm" showTagline={false} />

        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.text }]}>
            {done ? 'Password updated' : 'Reset Password'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {done
              ? 'Your password has been changed. You can continue into MeriBaari.'
              : 'Choose a new password for your account.'}
          </Text>
        </View>

        {done ? (
          <View style={styles.form}>
            <Text style={[styles.success, { color: theme.tints.secondary.fg }]}>
              Your new password is ready to use.
            </Text>
            <Button title="Continue" onPress={onContinue} />
          </View>
        ) : (
          <View style={styles.form}>
            <Controller
              control={form.control}
              name="password"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <PasswordInput
                  label="New Password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  accessibilityLabel="New password"
                  error={
                    typeof fieldState.error?.message === 'string'
                      ? fieldState.error.message
                      : undefined
                  }
                />
              )}
            />
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  accessibilityLabel="Confirm new password"
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
              title="Update Password"
              loading={isLoading}
              onPress={() => void form.handleSubmit(onSubmit)()}
            />
            <Button
              title="Back to Login"
              variant="ghost"
              disabled={isLoading}
              onPress={() => {
                void useAuthStore.getState().signOut().finally(() => {
                  router.replace(AuthHref.login);
                });
              }}
            />
          </View>
        )}

        <Pressable
          onPress={() => router.replace(AuthHref.welcome)}
          style={styles.welcomeLink}
          disabled={isLoading}
        >
          <Text style={[styles.back, { color: theme.textSecondary }]}>Back to Welcome</Text>
        </Pressable>
    </AuthHeroLayout>
  );
}

const styles = StyleSheet.create({
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
