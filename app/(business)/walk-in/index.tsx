import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { WalkInForm } from '@/components/business';
import { Screen } from '@/components/layout/Screen';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { replaceWalkInSuccess } from '@/features/business/navigation';
import { dataAccess } from '@/data';
import { useBusinessQueueStore } from '@/store/business-queue-store';
import type { WalkInDraft } from '@/types';

const WALK_IN_DEPARTMENTS = dataAccess.WALK_IN_DEPARTMENTS;
const WALK_IN_SERVICES = dataAccess.WALK_IN_SERVICES;

const INITIAL: WalkInDraft = {
  customerName: '',
  phone: '',
  departmentId: WALK_IN_DEPARTMENTS[0]?.id ?? '',
  serviceId: WALK_IN_SERVICES[0]?.id ?? '',
  priority: 'normal',
};

export default function WalkInScreen() {
  const addWalkIn = useBusinessQueueStore((s) => s.addWalkIn);
  const [draft, setDraft] = useState<WalkInDraft>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    setSubmitting(true);
    try {
      addWalkIn(draft);
      replaceWalkInSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <FlowHeader
            title="Add walk-in"
            subtitle="Issue a queue number at the counter"
            onBack={() => router.back()}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.padded}>
          <WalkInForm
            value={draft}
            onChange={setDraft}
            onSubmit={onSubmit}
            submitting={submitting}
          />
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
