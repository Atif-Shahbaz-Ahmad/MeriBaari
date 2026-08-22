import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeroLayout } from '@/components/auth/AuthHeroLayout';
import { RoleSelectCard } from '@/components/auth/RoleSelectCard';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import {
  signUpSchema,
  type SignUpFormValues,
} from '@/features/auth/schemas';
import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';

export default function SignupScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { t } = useTranslation();
  const { signup, isLoading, needsEmailVerification } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setError(null);
    if (!role) {
      setError('Select Customer or Business to continue.');
      return;
    }

    try {
      await signup(values.email.trim(), values.password, values.fullName.trim(), role);
      const state = useAuthStore.getState();
      if (state.needsEmailVerification || !state.session) {
        if (role === 'business') {
          Alert.alert(t('subscription.signup.title'), t('subscription.signup.body'));
        }
        router.replace(AuthHref.verifyEmail);
        return;
      }
      if (role === 'business') {
        Alert.alert(t('subscription.signup.title'), t('subscription.signup.body'));
      }
      router.replace(getHomeHref(state.role ?? role));
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  };

  return (
    <AuthHeroLayout>
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="sm" showTagline={false} />

        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Set up your MeriBaari profile and choose how you&apos;ll use the app.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={form.control}
            name="fullName"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label="Full Name"
                placeholder="Your name"
                autoComplete="name"
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
          <Controller
            control={form.control}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <PasswordInput
                label="Password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                accessibilityLabel="Password"
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
                accessibilityLabel="Confirm password"
                error={
                  typeof fieldState.error?.message === 'string'
                    ? fieldState.error.message
                    : undefined
                }
              />
            )}
          />

          <Text style={[styles.sectionLabel, { color: theme.text }]}>I want to use MeriBaari as</Text>
          <View style={styles.roles}>
            <RoleSelectCard
              role="customer"
              selected={role === 'customer'}
              onPress={() => setRole('customer')}
              index={0}
            />
            <RoleSelectCard
              role="business"
              selected={role === 'business'}
              onPress={() => setRole('business')}
              index={1}
            />
          </View>

          {role === 'business' ? (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {t('subscription.signup.body')}
            </Text>
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {needsEmailVerification ? (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Check your inbox to verify your email before signing in.
            </Text>
          ) : null}

          <Button
            title="Create Account"
            loading={isLoading}
            onPress={() => void form.handleSubmit(onSubmit)()}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Already have an account?{' '}
            <Text style={styles.link} onPress={() => router.push(AuthHref.login)}>
              Login
            </Text>
          </Text>
          <Pressable onPress={() => router.replace(AuthHref.welcome)}>
            <Text style={[styles.back, { color: theme.textSecondary }]}>Back to Welcome</Text>
          </Pressable>
        </View>
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
  sectionLabel: {
    ...Typography.bodyMedium,
    marginTop: Spacing.sm,
  },
  roles: {
    gap: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
  hint: {
    ...Typography.caption,
  },
  link: {
    color: Colors.primary,
    fontFamily: Typography.small.fontFamily,
    fontSize: Typography.small.fontSize,
  },
  footer: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  back: {
    ...Typography.caption,
  },
});
