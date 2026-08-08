import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSelectCard } from '@/components/auth/RoleSelectCard';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref, getHomeHref } from '@/features/auth/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/types';

export default function RoleSelectScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setRole, role: existingRole, isLoading, isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(existingRole ?? null);

  if (!isAuthenticated) {
    return <Redirect href={AuthHref.welcome} />;
  }

  if (existingRole) {
    return <Redirect href={getHomeHref(existingRole)} />;
  }

  const onContinue = async () => {
    if (!selected) return;
    await setRole(selected);
    router.replace(getHomeHref(selected));
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={ZoomIn.duration(420)} style={styles.heroIcon}>
          <Sparkles size={32} color={Colors.primary} strokeWidth={1.75} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]}>How will you use MeriBaari?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose one experience. You can refine organization details later — this sets up the
            right home screen for you.
          </Text>
        </Animated.View>

        <View style={styles.cards}>
          <RoleSelectCard
            role="customer"
            selected={selected === 'customer'}
            onPress={() => setSelected('customer')}
            index={0}
          />
          <RoleSelectCard
            role="business"
            selected={selected === 'business'}
            onPress={() => setSelected('business')}
            index={1}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(280).duration(400)} style={styles.footer}>
          <PrimaryButton
            title="Continue"
            onPress={() => void onContinue()}
            disabled={!selected}
            loading={isLoading}
            accessibilityHint={
              selected ? `Continue as ${selected}` : 'Select a role to continue'
            }
          />
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Your role is saved to your profile and can be changed later in settings.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  copy: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 340,
  },
  cards: {
    gap: Spacing.md,
  },
  footer: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  hint: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
