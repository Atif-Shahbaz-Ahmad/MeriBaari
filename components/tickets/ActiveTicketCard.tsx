import { StyleSheet, Text, View } from 'react-native';
import {
  Building2,
  Car,
  Clock3,
  GraduationCap,
  Hospital,
  Landmark,
  Stethoscope,
  Users,
  UtensilsCrossed,
} from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import {
  formatTicketDate,
  formatTicketTime,
  formatWaitTime,
} from '@/utils/formatting';
import type { QueueTicket } from '@/types';

const LOGO_ICONS = {
  hospital: Hospital,
  bank: Building2,
  building: Building2,
  clinic: Stethoscope,
  university: GraduationCap,
  utensils: UtensilsCrossed,
  landmark: Landmark,
  car: Car,
} as const;

interface ActiveTicketCardProps {
  ticket: QueueTicket;
}

export function ActiveTicketCard({ ticket }: ActiveTicketCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const Icon = LOGO_ICONS[ticket.logoIcon ?? 'building'] ?? Building2;

  return (
    <Animated.View entering={FadeInDown.duration(450)} style={[styles.wrap, Shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.orgRow}>
            <View style={styles.logo}>
              <Icon size={22} color={Colors.textInverse} strokeWidth={1.75} />
            </View>
            <View style={styles.orgText}>
              <Text style={styles.orgName} numberOfLines={1}>
                {ticket.organizationName}
              </Text>
              <Text style={styles.orgMeta} numberOfLines={1}>
                {ticket.departmentName}
              </Text>
              <Text style={styles.orgService} numberOfLines={1}>
                {ticket.serviceName}
              </Text>
            </View>
          </View>
          <StatusBadge status={ticket.status} showIcon size="md" />
        </View>

        <Animated.View entering={ZoomIn.delay(120).duration(400)} style={styles.numberBlock}>
          <Text style={styles.numberLabel}>{t('tickets.card.yourNumber')}</Text>
          <Text style={styles.number}>{ticket.ticketNumber}</Text>
        </Animated.View>

        <View style={styles.metrics}>
          <Metric label={t('tickets.card.nowServing')} value={ticket.currentServing} />
          <Metric label={t('tickets.card.peopleAhead')} value={String(ticket.peopleAhead)} />
          <Metric
            label={t('tickets.card.estWait')}
            value={
              ticket.estimatedWaitMinutes > 0
                ? formatWaitTime(ticket.estimatedWaitMinutes)
                : t('tickets.card.now')
            }
          />
        </View>
      </View>

      <View style={[styles.body, { backgroundColor: theme.card }]}>
        <View style={styles.infoGrid}>
          <InfoCell
            icon={<Users size={16} color={Colors.primary} />}
            label={t('tickets.card.status')}
            value={t(`tickets.status.${ticket.status}`)}
            theme={theme}
          />
          <InfoCell
            icon={<Building2 size={16} color={Colors.secondary} />}
            label={t('tickets.card.counter')}
            value={
              ticket.counter
                ? t('tickets.card.counterValue', { number: ticket.counter })
                : t('tickets.card.tba')
            }
            theme={theme}
          />
          <InfoCell
            icon={<Clock3 size={16} color={Colors.accent} />}
            label={t('tickets.card.date')}
            value={formatTicketDate(ticket.joinedAt)}
            theme={theme}
          />
          <InfoCell
            icon={<Clock3 size={16} color={Colors.primary} />}
            label={t('tickets.card.joined')}
            value={formatTicketTime(ticket.joinedAt)}
            theme={theme}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoCell({
  icon,
  label,
  value,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: { background: string; text: string; textMuted: string };
}) {
  return (
    <View style={[styles.infoCell, { backgroundColor: theme.background }]}>
      {icon}
      <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  orgRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgText: {
    flex: 1,
    gap: 2,
  },
  orgName: {
    ...Typography.h3,
    color: Colors.textInverse,
  },
  orgMeta: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.85)',
  },
  orgService: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  numberBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  numberLabel: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
  number: {
    fontSize: 56,
    lineHeight: 64,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metric: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    gap: 4,
  },
  metricLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  metricValue: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  infoCell: {
    width: '48%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  infoLabel: {
    ...Typography.caption,
  },
  infoValue: {
    ...Typography.small,
  },
});
