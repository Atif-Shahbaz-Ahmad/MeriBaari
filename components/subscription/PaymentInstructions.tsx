import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { formatSubscriptionPrice, PAYMENT_CONFIG } from '@/config/payment';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { copyToClipboard } from '@/lib/clipboard';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

interface PaymentInstructionsProps {
  onCopied?: (label: string) => void;
}

function CopyRow({
  label,
  value,
  copyable,
  onCopied,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopied?: (label: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.text }]} selectable>
          {value}
        </Text>
      </View>
      {copyable ? (
        <Pressable
          onPress={() => {
            void copyToClipboard(value).then(() => onCopied?.(label));
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${t('subscription.payment.copy')} ${label}`}
          style={[styles.copyBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
        >
          <Copy size={16} color={Colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function PaymentInstructions({ onCopied }: PaymentInstructionsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const price = formatSubscriptionPrice();

  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        <Text style={[styles.heading, { color: theme.text }]}>
          {t('subscription.payment.bankTitle')}
        </Text>
        <CopyRow label={t('subscription.payment.bankName')} value={PAYMENT_CONFIG.bank.name} />
        <CopyRow
          label={t('subscription.payment.accountTitle')}
          value={PAYMENT_CONFIG.bank.accountTitle}
        />
        <CopyRow
          label={t('subscription.payment.accountNumber')}
          value={PAYMENT_CONFIG.bank.accountNumber}
          copyable
          onCopied={onCopied}
        />
        <CopyRow
          label={t('subscription.payment.iban')}
          value={PAYMENT_CONFIG.bank.iban}
          copyable
          onCopied={onCopied}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.heading, { color: theme.text }]}>
          {t('subscription.payment.easypaisaTitle')}
        </Text>
        <CopyRow
          label={t('subscription.payment.accountTitle')}
          value={PAYMENT_CONFIG.easypaisa.accountTitle}
        />
        <CopyRow
          label={t('subscription.payment.easypaisaNumber')}
          value={PAYMENT_CONFIG.easypaisa.number}
          copyable
          onCopied={onCopied}
        />
      </Card>

      <Card style={[styles.note, { backgroundColor: theme.tints.primary.bg, borderColor: theme.primary }]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>
          {t('subscription.payment.amountLabel')}: {price} / {t('subscription.payment.month')}
        </Text>
        <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
          {t('subscription.payment.uploadNote')}
        </Text>
        <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
          {t('subscription.payment.verificationNote')}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.sm,
  },
  heading: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Typography.caption,
  },
  value: {
    ...Typography.bodyMedium,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    gap: Spacing.sm,
    borderWidth: 1,
  },
  noteTitle: {
    ...Typography.bodyMedium,
  },
  noteBody: {
    ...Typography.caption,
  },
});
