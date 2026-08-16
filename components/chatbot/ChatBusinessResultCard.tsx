import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { organizationCategoryLabelKey } from '@/constants/organization-categories';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatBusinessCard } from '@/domain/models/chatbot';
import { formatDistanceKm } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type ChatBusinessResultCardProps = {
  card: ChatBusinessCard;
  onView: () => void;
  onJoinQueue?: () => void;
};

function formatPrice(price: number): string {
  return `Rs. ${Math.round(price).toLocaleString('en-PK')}`;
}

export function ChatBusinessResultCard({
  card,
  onView,
  onJoinQueue,
}: ChatBusinessResultCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const category = t(organizationCategoryLabelKey(card.category));
  const distance = card.distanceKm != null ? formatDistanceKm(card.distanceKm) : null;
  const serviceLine = [
    card.serviceName,
    card.price != null ? formatPrice(card.price) : null,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <Card elevated style={styles.card}>
      <Pressable onPress={onView} accessibilityRole="button">
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {category}
          {distance ? ` · ${distance}` : ''}
        </Text>
        {serviceLine ? (
          <Text style={[styles.service, { color: theme.text }]} numberOfLines={1}>
            {serviceLine}
          </Text>
        ) : null}
        {card.address || card.city ? (
          <View style={styles.addressRow}>
            <MapPin size={13} color={theme.textMuted} strokeWidth={2} />
            <Text style={[styles.address, { color: theme.textMuted }]} numberOfLines={1}>
              {[card.address, card.city].filter(Boolean).join(', ')}
            </Text>
          </View>
        ) : null}
        <Text
          style={[
            styles.status,
            { color: card.isOpen ? theme.tints.secondary.fg : theme.textMuted },
          ]}
        >
          {card.isOpen ? t('chatbot.openNow') : t('chatbot.unavailable')}
        </Text>
      </Pressable>
      <View style={styles.actions}>
        <Button
          title={t('chatbot.viewBusiness')}
          onPress={onView}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={styles.action}
        />
        {card.isOpen && onJoinQueue ? (
          <Button
            title={t('chatbot.joinQueue')}
            onPress={onJoinQueue}
            size="sm"
            fullWidth={false}
            style={styles.action}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  name: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.small,
    marginTop: 2,
  },
  service: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  address: {
    ...Typography.caption,
    flex: 1,
  },
  status: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  action: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
});
