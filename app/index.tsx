import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Logo } from '@/components/layout/Logo';
import { Colors } from '@/constants/colors';
import { useAppBootstrap } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-theme';

/**
 * Animated splash + auth/onboarding gate.
 * Checks session & onboarding, then redirects automatically.
 */
export default function SplashGate() {
  const scheme = useColorScheme();
  const { isReady, isAuthenticated, hasCompletedOnboarding } = useAppBootstrap();
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
    if (isReady) {
      fadeOut.value = withDelay(450, withTiming(0, { duration: 350 }));
    }
  }, [isReady, fadeOut]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  if (isReady) {
    if (!hasCompletedOnboarding) {
      return <Redirect href="/(auth)/onboarding" />;
    }
    if (!isAuthenticated) {
      return <Redirect href="/(auth)/login" />;
    }
    return <Redirect href="/(tabs)" />;
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
      <View style={styles.footerDot}>
        <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
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
  footerDot: {
    position: 'absolute',
    bottom: 64,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
