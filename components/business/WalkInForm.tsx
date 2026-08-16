import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { Department, Service } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import { formatWaitTime } from '@/utils/formatting';
import type { BusinessPriority, WalkInDraft } from '@/types';

const WALK_IN_PRIORITIES = dataAccess.WALK_IN_PRIORITIES;

interface WalkInFormProps {
  value: WalkInDraft;
  onChange: (next: WalkInDraft) => void;
  onSubmit: () => void;
  departments: Department[];
  services: Service[];
  departmentsLoading?: boolean;
  servicesLoading?: boolean;
  submitting?: boolean;
  onAddDepartment?: () => void;
}

function formatServicePrice(price: number | null): string {
  if (price === null || price === undefined) return 'Price —';
  return `Rs ${Number(price).toFixed(0)}`;
}

export function WalkInForm({
  value,
  onChange,
  onSubmit,
  departments,
  services,
  departmentsLoading = false,
  servicesLoading = false,
  submitting,
  onAddDepartment,
}: WalkInFormProps) {
  const theme = useTheme();

  const patch = (partial: Partial<WalkInDraft>) => onChange({ ...value, ...partial });

  const selectDepartment = (department: Department) => {
    patch({
      departmentId: department.id,
      departmentName: department.name,
      serviceId: '',
      serviceName: '',
    });
  };

  const selectService = (service: Service) => {
    patch({
      serviceId: service.id,
      serviceName: service.name,
    });
  };

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
        {departmentsLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Loading departments…
            </Text>
          </View>
        ) : departments.length === 0 ? (
          <EmptyState
            title="No departments yet"
            description="Add a department for this business before issuing walk-in tickets."
            actionLabel={onAddDepartment ? 'Add department' : undefined}
            onActionPress={onAddDepartment}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {departments.map((dept) => {
              const selected = value.departmentId === dept.id;
              return (
                <Pressable
                  key={dept.id}
                  onPress={() => selectDepartment(dept)}
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
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? Colors.textInverse : theme.text },
                    ]}
                  >
                    {dept.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Service</Text>
        {!value.departmentId ? (
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Select a department to see its services.
          </Text>
        ) : servicesLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Loading services…
            </Text>
          </View>
        ) : services.length === 0 ? (
          <EmptyState
            title="No services in this department"
            description="Add an active service to this department, then try again."
          />
        ) : (
          <View style={styles.serviceList}>
            {services.map((service) => {
              const selected = value.serviceId === service.id;
              const duration =
                service.durationMinutes > 0
                  ? formatWaitTime(service.durationMinutes)
                  : null;
              const statusLabel = service.isActive
                ? service.status === 'paused'
                  ? 'Paused'
                  : 'Available'
                : 'Inactive';
              return (
                <Pressable
                  key={service.id}
                  onPress={() => selectService(service)}
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: selected ? theme.tints.secondary.bg : theme.card,
                      borderColor: selected ? Colors.secondary : theme.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.serviceName,
                      { color: selected ? theme.tints.secondary.fg : theme.text },
                    ]}
                  >
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceMeta, { color: theme.textSecondary }]}>
                    {[formatServicePrice(service.price), duration, statusLabel]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
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
                    backgroundColor: selected ? theme.tints.accent.bg : theme.card,
                    borderColor: selected ? Colors.accent : theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? theme.tints.accent.fg : theme.text },
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
          disabled={
            !value.departmentId ||
            !value.serviceId ||
            departmentsLoading ||
            servicesLoading
          }
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
  hint: {
    ...Typography.caption,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chips: {
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
  serviceList: {
    gap: Spacing.sm,
  },
  serviceCard: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  serviceName: {
    ...Typography.bodyMedium,
  },
  serviceMeta: {
    ...Typography.caption,
  },
});
