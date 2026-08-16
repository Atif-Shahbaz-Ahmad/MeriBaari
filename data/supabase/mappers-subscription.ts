import type { SubscriptionPaymentRow } from '@/supabase/types/database';
import type {
  SubscriptionPayment,
  SubscriptionPaymentMethod,
  SubscriptionPaymentStatus,
} from '@/domain/models/subscription';

function normalizeMethod(value: string | null | undefined): SubscriptionPaymentMethod {
  return value === 'easypaisa' ? 'easypaisa' : 'bank_transfer';
}

function normalizeStatus(value: string | null | undefined): SubscriptionPaymentStatus {
  if (value === 'approved' || value === 'rejected') return value;
  return 'pending';
}

export function mapSubscriptionPaymentRow(
  row: SubscriptionPaymentRow,
): SubscriptionPayment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? 'PKR',
    paymentMethod: normalizeMethod(row.payment_method),
    paymentProofPath: row.payment_proof_path,
    status: normalizeStatus(row.status),
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
