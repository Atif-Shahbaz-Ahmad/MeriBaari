import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { replaceBusinessHome } from '@/features/business/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function PaymentSubmittedScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <Card style={styles.card}>
            <View style={[styles.icon, { backgroundColor: theme.tints.secondary.bg }]}>
              <CheckCircle2 size={36} color={theme.tints.secondary.fg} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('subscription.submitted.title')}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t('subscription.submitted.body')}
            </Text>
            <PrimaryButton
              title={t('subscription.submitted.dashboard')}
              onPress={replaceBusinessHome}
            />
            <Text
              style={[styles.back, { color: theme.textMuted }]}
              onPress={() => router.back()}
            >
              {t('common.back')}
            </Text>
          </Card>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
  },
  back: {
    ...Typography.caption,
  },
});
