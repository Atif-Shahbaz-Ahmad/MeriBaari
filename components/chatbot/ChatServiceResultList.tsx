import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatServiceInfoCard } from '@/domain/models/chatbot';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type ChatServiceResultListProps = {
  services: ChatServiceInfoCard[];
};

export function ChatServiceResultList({ services }: ChatServiceResultListProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (services.length === 0) return null;

  return (
    <Card elevated style={styles.card}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t('businessChatbot.servicesTitle')}
      </Text>
      {services.map((service) => (
        <View key={service.id} style={styles.row}>
          <View style={styles.copy}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {service.name}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
              {service.departmentName}
              {service.isActive ? '' : ` · ${t('businessChatbot.inactive')}`}
            </Text>
          </View>
          <Text style={[styles.price, { color: theme.text }]}>
            {service.price != null ? `Rs. ${service.price}` : '—'}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.bodyMedium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.body,
  },
  meta: {
    ...Typography.caption,
  },
  price: {
    ...Typography.bodyMedium,
  },
});
