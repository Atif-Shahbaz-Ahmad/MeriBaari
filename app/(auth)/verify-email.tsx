import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getAuthErrorMessage } from '@/domain/errors/auth-error';
import { AuthHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shown only when Supabase requires email confirmation after signup.
 * Existing sessions never land here on cold start.
 */
export default function VerifyEmailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    pendingVerificationEmail,
    resendSignupEmail,
    clearPendingVerification,
    isLoading,
  } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = pendingVerificationEmail;

  const onResend = async () => {
    setError(null);
    setMessage(null);
    try {
      await resendSignupEmail();
      setMessage('Verification email sent. Check your inbox and spam folder.');
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  };

  const onBackToLogin = () => {
    clearPendingVerification();
    router.replace(AuthHref.login);
  };

  const onChangeEmail = () => {
    clearPendingVerification();
    router.replace(AuthHref.signup);
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.tints.primary.bg }]}>
        <Mail size={32} color={Colors.primary} strokeWidth={1.75} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Verify your email</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        We&apos;ve sent a verification email to your email address.
      </Text>
      {email ? (
        <Text style={[styles.email, { color: theme.text }]}>{email}</Text>
      ) : null}
      <Text style={[styles.body, { color: theme.textMuted }]}>
        Open the link in that email to activate your account, then log in. You will not be asked to
        verify again on every app launch once your session is active.
      </Text>

      {message ? (
        <Text style={[styles.success, { color: theme.tints.secondary.fg }]}>{message}</Text>
      ) : null}
      {error ? (
        <Text style={[styles.error, { color: theme.tints.error.fg }]}>{error}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button title="Resend verification email" loading={isLoading} onPress={() => void onResend()} />
        <Button title="Change email" variant="outline" onPress={onChangeEmail} />
        <Button title="Back to Login" variant="ghost" onPress={onBackToLogin} />
      </View>

      <Pressable onPress={() => router.replace(AuthHref.welcome)} style={styles.welcomeLink}>
        <Text style={[styles.back, { color: theme.textSecondary }]}>Back to Welcome</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
  },
  email: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  success: {
    ...Typography.caption,
    textAlign: 'center',
  },
  error: {
    ...Typography.caption,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  welcomeLink: {
    alignSelf: 'center',
    marginTop: 'auto',
  },
  back: {
    ...Typography.caption,
  },
});
