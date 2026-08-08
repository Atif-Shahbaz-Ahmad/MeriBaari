import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import type { BusinessPriority, WalkInDraft } from '@/types';

const WALK_IN_DEPARTMENTS = dataAccess.WALK_IN_DEPARTMENTS;
const WALK_IN_PRIORITIES = dataAccess.WALK_IN_PRIORITIES;
const WALK_IN_SERVICES = dataAccess.WALK_IN_SERVICES;

interface WalkInFormProps {
  value: WalkInDraft;
  onChange: (next: WalkInDraft) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function WalkInForm({ value, onChange, onSubmit, submitting }: WalkInFormProps) {
  const theme = useTheme();
  const services = WALK_IN_SERVICES.filter((s) => s.departmentId === value.departmentId);

  const patch = (partial: Partial<WalkInDraft>) => onChange({ ...value, ...partial });

  return (
    <View style={styles.form}>
      <Animated.View entering={FadeInDown.duration(350)}>
        <Input
          label="Customer name (optional)"
          placeholder="e.g. Ahmed Khan"
          value={value.customerName}
          onChangeText={(customerName) => patch({ customerName })}
          autoCapitalize="words"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(350)}>
        <Input
          label="Phone number (optional)"
          placeholder="+92 300 0000000"
          value={value.phone}
          onChangeText={(phone) => patch({ phone })}
          keyboardType="phone-pad"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Department</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {WALK_IN_DEPARTMENTS.map((dept) => {
            const selected = value.departmentId === dept.id;
            return (
              <Pressable
                key={dept.id}
                onPress={() => {
                  const firstService = WALK_IN_SERVICES.find((s) => s.departmentId === dept.id);
                  patch({
                    departmentId: dept.id,
                    serviceId: firstService?.id ?? value.serviceId,
                  });
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? Colors.primary : theme.card,
                    borderColor: selected ? Colors.primary : theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, { color: selected ? Colors.textInverse : theme.text }]}>
                  {dept.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Service</Text>
        <View style={styles.chipWrap}>
          {services.map((service) => {
            const selected = value.serviceId === service.id;
            return (
              <Pressable
                key={service.id}
                onPress={() => patch({ serviceId: service.id })}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? Colors.secondary : theme.card,
                    borderColor: selected ? Colors.secondary : theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? Colors.textInverse : theme.text },
                  ]}
                >
                  {service.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Priority (placeholder)</Text>
        <View style={styles.chips}>
          {WALK_IN_PRIORITIES.map((item) => {
            const selected = value.priority === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => patch({ priority: item.id as BusinessPriority })}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? Colors.accent50 : theme.card,
                    borderColor: selected ? Colors.accent : theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? '#B45309' : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(350)}>
        <PrimaryButton
          title="Add to Queue"
          onPress={onSubmit}
          loading={submitting}
          disabled={!value.departmentId || !value.serviceId}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.small,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  chipText: {
    ...Typography.small,
  },
});
