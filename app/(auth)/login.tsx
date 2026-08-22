import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeroLayout } from '@/components/auth/AuthHeroLayout';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas';
import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

export default function LoginScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values.email.trim(), values.password);
      router.replace(getHomeHref(useAuthStore.getState().role));
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  };

  return (
    <AuthHeroLayout>
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="sm" showTagline={false} />

        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.text }]}>{t('auth.login.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('auth.login.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <Input
                label={t('auth.login.email')}
                placeholder={t('auth.login.emailPlaceholder')}
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
                label={t('auth.login.password')}
                placeholder={t('auth.login.passwordPlaceholder')}
                autoComplete="password"
                textContentType="password"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                accessibilityLabel={t('auth.login.password')}
                error={
                  typeof fieldState.error?.message === 'string'
                    ? fieldState.error.message
                    : undefined
                }
              />
            )}
          />

          <Pressable
            onPress={() => router.push(AuthHref.forgotPassword)}
            accessibilityRole="link"
            style={styles.forgotRow}
          >
            <Text style={styles.link}>{t('auth.login.forgot')}</Text>
          </Pressable>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Button
            title={t('auth.login.cta')}
            loading={isLoading}
            onPress={() => void form.handleSubmit(onSubmit)()}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {t('auth.login.noAccount')}{' '}
            <Text style={styles.link} onPress={() => router.push(AuthHref.signup)}>
              {t('auth.login.createAccount')}
            </Text>
          </Text>
          <Pressable onPress={() => router.replace(AuthHref.welcome)}>
            <Text style={[styles.back, { color: theme.textSecondary }]}>
              {t('auth.login.backWelcome')}
            </Text>
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
  },
  link: {
    color: Colors.primary,
    fontFamily: Typography.small.fontFamily,
    fontSize: Typography.small.fontSize,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
  footer: {
    gap: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footerText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  back: {
    ...Typography.caption,
  },
});
