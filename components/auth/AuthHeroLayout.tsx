import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';

const HERO_SOURCE = require('@/assets/images/hero.png');

type AuthHeroLayoutProps = {
  children: ReactNode;
  /** Taller photo on welcome; compact on forms so the keyboard still fits. */
  variant?: 'welcome' | 'form';
};

/**
 * Mobile auth shell: photo on top, content underneath.
 * Mirrors the web split-hero, stacked for a phone viewport.
 */
export function AuthHeroLayout({
  children,
  variant = 'form',
}: AuthHeroLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const ratio = variant === 'welcome' ? 0.32 : 0.22;
  const heroHeight = Math.round(
    Math.min(variant === 'welcome' ? 240 : 176, Math.max(128, height * ratio)),
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.heroFrame,
          {
            height: heroHeight,
            marginTop: insets.top + Spacing.sm,
            backgroundColor: theme.tints.muted.bg,
          },
        ]}
      >
        <Image
          source={HERO_SOURCE}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Skip the wait with MeriBaari"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  heroFrame: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
});
