import { StyleSheet, Text, View } from 'react-native';
import { BellRing, Clock3, Radio } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Save Time',
    description:
      'Join digital queues from anywhere and skip the physical waiting line. Your time matters.',
    icon: 'clock' as const,
  },
  {
    id: '2',
    title: 'Live Queue Tracking',
    description:
      'Watch your position update in real time. Know exactly when your turn is approaching.',
    icon: 'radio' as const,
  },
  {
    id: '3',
    title: 'Get Notified',
    description:
      'Receive timely alerts before your turn so you can arrive ready — never miss your spot.',
    icon: 'bell' as const,
  },
];

interface OnboardingIllustrationProps {
  icon: 'clock' | 'radio' | 'bell';
}

export function OnboardingIllustration({ icon }: OnboardingIllustrationProps) {
  const theme = useTheme();
  const Icon = icon === 'clock' ? Clock3 : icon === 'radio' ? Radio : BellRing;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.glow, { backgroundColor: theme.tints.primary.bg }]} />
      <View style={[styles.iconCircle, { backgroundColor: theme.tints.primary.bgStrong }]}>
        <Icon size={56} color={Colors.primary} strokeWidth={1.75} />
      </View>
      <Text style={[styles.caption, { color: theme.textMuted }]}>Illustration</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 280,
    borderRadius: Radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  caption: {
    ...Typography.caption,
    marginTop: Spacing.md,
  },
});
