import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Logo } from '@/components/layout/Logo';
import { Colors } from '@/constants/colors';
import { AuthHref, getHomeHref, getUnauthenticatedHref } from '@/features/auth/navigation';
import { useAppBootstrap } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

/**
 * Animated splash + auth/onboarding/role gate.
 * Session restore completes before any auth screen — no login flash.
 */
export default function SplashGate() {
  const scheme = useColorScheme();
  const { isReady, isAuthenticated, hasCompletedOnboarding, role } = useAppBootstrap();
  const profileLoadFailed = useAuthStore((s) => s.profileLoadFailed);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const fadeOut = useSharedValue(1);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isReady) {
      fadeOut.value = withDelay(450, withTiming(0, { duration: 350 }));
    }
  }, [isReady, fadeOut]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  if (isReady) {
    if (!hasCompletedOnboarding) {
      return <Redirect href={AuthHref.onboarding} />;
    }
    if (!isAuthenticated) {
      return <Redirect href={getUnauthenticatedHref()} />;
    }
    if (passwordRecoveryPending) {
      return <Redirect href={AuthHref.resetPassword} />;
    }
    if (profileLoadFailed) {
      return <Redirect href={AuthHref.profileRecovery} />;
    }
    return <Redirect href={getHomeHref(role)} />;
  }

  const isDark = scheme === 'dark';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.darkBackground : Colors.background },
        containerStyle,
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Logo variant={isDark ? 'dark' : 'light'} size="lg" showTagline />
      </Animated.View>
      <View style={styles.footer}>
        {isRestoringSession ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
