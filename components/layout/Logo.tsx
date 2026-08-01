import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { LogoMark } from '@/components/layout/LogoMark';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  markOnly?: boolean;
  style?: ViewStyle;
}

const SIZES = {
  sm: { mark: 36, title: 18 },
  md: { mark: 56, title: 24 },
  lg: { mark: 88, title: 32 },
} as const;

/**
 * Full MeriBaari wordmark for onboarding, splash, and headers.
 * Use markOnly for compact UI (headers, avatars).
 */
export function Logo({
  variant = 'light',
  size = 'md',
  showTagline = true,
  markOnly = false,
  style,
}: LogoProps) {
  const dims = SIZES[size];
  const meriColor = variant === 'light' ? Colors.text : Colors.textInverse;
  const baariColor = Colors.primary;

  if (markOnly) {
    return (
      <View style={[styles.markOnly, style]}>
        <LogoMark size={dims.mark} variant={variant} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LogoMark size={dims.mark} variant={variant} />
      <View style={styles.wordmark}>
        <Text style={[styles.title, { fontSize: dims.title, lineHeight: dims.title + 8 }]}>
          <Text style={{ color: meriColor }}>Meri</Text>
          <Text style={{ color: baariColor }}>Baari</Text>
        </Text>
        {showTagline ? <Text style={styles.tagline}>My Turn</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  markOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.h2.fontFamily,
    letterSpacing: -0.3,
  },
  tagline: {
    ...Typography.small,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
});
