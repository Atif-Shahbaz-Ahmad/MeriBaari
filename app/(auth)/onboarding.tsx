import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';
import {
  ONBOARDING_SLIDES,
  OnboardingIllustration,
} from '@/features/auth/components/OnboardingSlide';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/store/onboarding-store';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const listRef = useRef<FlatList<(typeof ONBOARDING_SLIDES)[number]>>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const goNext = () => {
    if (index >= ONBOARDING_SLIDES.length - 1) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setIndex(viewableItems[0].index);
      }
    },
  ).current;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="sm" showTagline={false} />
        <Pressable onPress={() => void finish()} hitSlop={12}>
          <Text style={[styles.skip, { color: theme.textSecondary }]}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <OnboardingIllustration icon={item.icon} />
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.indicators}>
          {ONBOARDING_SLIDES.map((slide, i) => (
            <PageDot key={slide.id} active={i === index} />
          ))}
        </View>
        <Button
          title={index === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={goNext}
        />
      </View>
    </View>
  );
}

function PageDot({ active }: { active: boolean }) {
  const widthValue = useSharedValue(active ? 24 : 8);

  widthValue.value = withSpring(active ? 24 : 8);

  const style = useAnimatedStyle(() => ({
    width: widthValue.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        style,
        { backgroundColor: active ? Colors.primary : Colors.border },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    ...Typography.bodyMedium,
  },
  slide: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h1,
  },
  description: {
    ...Typography.body,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
