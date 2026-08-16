import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PartyPopper } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { replaceBusinessHome } from '@/features/business/navigation';
import { replaceSubscriptionPay } from '@/features/subscription/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function SubscriptionWelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <Card style={styles.hero}>
            <View style={[styles.icon, { backgroundColor: theme.tints.primary.bg }]}>
              <PartyPopper size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('subscription.welcome.title')}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t('subscription.welcome.body')}
            </Text>
            <PrimaryButton
              title={t('subscription.welcome.subscribeNow')}
              onPress={replaceSubscriptionPay}
            />
            <Button
              title={t('subscription.welcome.later')}
              variant="ghost"
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
  hero: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  icon: {
    width: 72,
    height: 72,
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
    marginTop: Spacing.sm,
  },
});
