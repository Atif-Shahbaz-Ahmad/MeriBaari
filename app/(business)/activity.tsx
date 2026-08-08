import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActivityTimeline } from '@/components/business';
import { Screen } from '@/components/layout/Screen';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { useBusinessQueueStore } from '@/store/business-queue-store';

export default function QueueActivityScreen() {
  const { queueId } = useLocalSearchParams<{ queueId?: string }>();
  const activity = useBusinessQueueStore((s) => s.activity);
  const queues = useBusinessQueueStore((s) => s.queues);

  const queue = queueId ? queues.find((q) => q.id === queueId) : undefined;
  const items = queueId
    ? activity.filter((item) => item.queueId === queueId)
    : [...activity].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <FlowHeader
            title="Queue activity"
            subtitle={queue ? queue.name : 'All queues · recent actions'}
            onBack={() => router.back()}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.padded}>
          <ActivityTimeline items={items} title="Timeline" />
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
    gap: Spacing.sm,
  },
});
