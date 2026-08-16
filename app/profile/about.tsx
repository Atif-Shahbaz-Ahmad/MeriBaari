import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Logo } from '@/components/layout/Logo';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { InfoRow } from '@/components/ui/InfoRow';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useColorScheme, useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';

const MOCK_ABOUT = dataAccess.MOCK_ABOUT;

export default function AboutScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader title="About" subtitle="MeriBaari · My Turn" onBack={() => router.back()} />
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(80).duration(420)} style={styles.logoBlock}>
          <Logo variant={scheme === 'dark' ? 'dark' : 'light'} size="lg" showTagline />
          <View style={[styles.versionPill, { backgroundColor: theme.tints.primary.bg }]}>
            <Text style={[styles.versionText, { color: theme.tints.primary.fg }]}>
              Version {MOCK_ABOUT.version}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.padded}>
          <Card style={styles.block}>
            <Text style={[styles.heading, { color: theme.text }]}>What is MeriBaari?</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {MOCK_ABOUT.description}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <Card style={styles.block}>
            <Text style={[styles.heading, { color: theme.text }]}>Mission</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{MOCK_ABOUT.mission}</Text>
            <Text style={[styles.heading, { color: theme.text, marginTop: Spacing.md }]}>Vision</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{MOCK_ABOUT.vision}</Text>
            <Text style={[styles.heading, { color: theme.text, marginTop: Spacing.md }]}>
              Our Goal
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{MOCK_ABOUT.goal}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.padded}>
          <Card style={styles.block}>
            <Text style={[styles.heading, { color: theme.text }]}>Technology</Text>
            <View style={styles.chips}>
              {MOCK_ABOUT.technologies.map((tech) => (
                <View
                  key={tech}
                  style={[styles.chip, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>{tech}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.padded}>
          <Card style={styles.block}>
            <Text style={[styles.heading, { color: theme.text }]}>Developer Team</Text>
            {MOCK_ABOUT.team.map((member) => (
              <InfoRow key={member.name} label={member.role} value={member.name} />
            ))}
          </Card>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  logoBlock: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  versionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  versionText: {
    ...Typography.small,
  },
  block: {
    gap: Spacing.sm,
  },
  heading: {
    ...Typography.h3,
  },
  body: {
    ...Typography.body,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    ...Typography.small,
  },
});
