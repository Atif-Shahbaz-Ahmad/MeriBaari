import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Linking,
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
import {
  emailSchema,
  otpSchema,
  phoneSchema,
  type EmailFormValues,
  type OtpFormValues,
  type PhoneFormValues,
} from '@/features/auth/schemas';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { maskDestination } from '@/utils/formatting';
import type { OtpChannel } from '@/types';

type AuthStep = 'identify' | 'otp';

export default function LoginScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp, signInWithDemo, isLoading } = useAuth();

  const [channel, setChannel] = useState<OtpChannel>('phone');
  const [step, setStep] = useState<AuthStep>('identify');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState<string | null>(null);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onSendOtp = async () => {
    setError(null);
    try {
      if (channel === 'phone') {
        const valid = await phoneForm.trigger();
        if (!valid) return;
        const phone = phoneForm.getValues('phone').trim();
        await sendOtp('phone', phone);
        setDestination(phone);
      } else {
        const valid = await emailForm.trigger();
        if (!valid) return;
        const email = emailForm.getValues('email').trim();
        await sendOtp('email', email);
        setDestination(email);
      }
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send code');
    }
  };

  const onVerifyOtp = async () => {
    setError(null);
    const valid = await otpForm.trigger();
    if (!valid) return;

    try {
      await verifyOtp(channel, destination, otpForm.getValues('otp'));
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code');
    }
  };

  const onDemo = async () => {
    setError(null);
    try {
      await signInWithDemo();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo sign-in failed');
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
          <Text style={[styles.title, { color: theme.text }]}>Welcome to MeriBaari</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Join smart queues, save your time.
          </Text>
        </View>

        <View style={[styles.modeSwitch, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ModeTab
            label="Phone"
            active={channel === 'phone'}
            onPress={() => {
              setChannel('phone');
              setStep('identify');
              setError(null);
            }}
          />
          <ModeTab
            label="Email"
            active={channel === 'email'}
            onPress={() => {
              setChannel('email');
              setStep('identify');
              setError(null);
            }}
          />
        </View>

        {step === 'identify' ? (
          <View style={styles.form}>
            {channel === 'phone' ? (
              <Controller
                control={phoneForm.control}
                name="phone"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Phone number"
                    placeholder="+92 300 1234567"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    hint={!isSupabaseConfigured ? 'Demo mode: any valid number works' : undefined}
                  />
                )}
              />
            ) : (
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Email address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    hint={!isSupabaseConfigured ? 'Demo mode: any valid email works' : undefined}
                  />
                )}
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title="Continue" onPress={() => void onSendOtp()} loading={isLoading} />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.otpHint, { color: theme.textSecondary }]}>
              Enter the 6-digit code sent to {maskDestination(destination, channel)}
              {!isSupabaseConfigured ? ' (use any 6 digits in demo mode)' : ''}
            </Text>
            <Controller
              control={otpForm.control}
              name="otp"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <Input
                  label="Verification code"
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Verify & Continue" onPress={() => void onVerifyOtp()} loading={isLoading} />
            <Button
              title="Change number / email"
              variant="ghost"
              onPress={() => {
                setStep('identify');
                otpForm.reset();
                setError(null);
              }}
            />
          </View>
        )}

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.or, { color: theme.textMuted }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        <Button
          title="Continue with Google"
          variant="outline"
          onPress={() => setError('Google Sign-In will be enabled in a later release.')}
        />

        {!isSupabaseConfigured ? (
          <Button title="Continue as Guest (Demo)" variant="secondary" onPress={() => void onDemo()} />
        ) : null}

        <Text style={[styles.legal, { color: theme.textMuted }]}>
          By continuing, you agree to our{' '}
          <Text style={styles.link} onPress={() => void Linking.openURL('https://meribaari.app/terms')}>
            Terms
          </Text>{' '}
          &{' '}
          <Text
            style={styles.link}
            onPress={() => void Linking.openURL('https://meribaari.app/privacy')}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeTab,
        active && { backgroundColor: Colors.primary },
      ]}
    >
      <Text style={[styles.modeLabel, { color: active ? Colors.textInverse : Colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  hero: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeLabel: {
    ...Typography.small,
  },
  form: {
    gap: Spacing.md,
  },
  otpHint: {
    ...Typography.body,
  },
  error: {
    ...Typography.small,
    color: Colors.error,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  or: {
    ...Typography.caption,
  },
  legal: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  link: {
    color: Colors.primary,
    fontFamily: Typography.small.fontFamily,
  },
});
