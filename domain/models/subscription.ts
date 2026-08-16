export type SubscriptionPaymentStatus = 'pending' | 'approved' | 'rejected';

export type SubscriptionPaymentMethod = 'bank_transfer' | 'easypaisa';

export interface SubscriptionPayment {
  id: string;
  organizationId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  paymentProofPath: string;
  status: SubscriptionPaymentStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  organizationName?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
}

export interface SubscriptionPaymentReview extends SubscriptionPayment {
  organizationName: string;
  organizationCategory: string;
  organizationPhone: string | null;
  organizationAddress: string;
  organizationCity: string;
  organizationLatitude: number | null;
  organizationLongitude: number | null;
  organizationLogoUrl: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  services: Array<{
    id: string;
    name: string;
    departmentName: string;
    price: number | null;
  }>;
  proofSignedUrl: string | null;
}

export interface AdminSubscriptionStats {
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  activeBusinesses: number;
}

/** Public-facing business card for admins — no services or prices. */
export interface AdminBusinessSummary {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  workingHours: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  approvedAt: string | null;
  isActive: boolean;
  status: string;
  adminHidden: boolean;
  adminHiddenReason: string | null;
  adminHiddenAt: string | null;
}

export interface SubmitSubscriptionPaymentInput {
  organizationId: string;
  paymentMethod: SubscriptionPaymentMethod;
  localProofUri: string;
  amount: number;
  currency?: string;
}

export interface SetAdminBusinessVisibilityInput {
  organizationId: string;
  visible: boolean;
  reason?: string;
}

export function lastSubscriptionApprovalAt(
  latestPayment: Pick<SubscriptionPayment, 'status' | 'reviewedAt'> | null | undefined,
  organizationApprovedAt: string | null | undefined,
): string | null {
  if (latestPayment?.status === 'approved' && latestPayment.reviewedAt) {
    return latestPayment.reviewedAt;
  }
  return organizationApprovedAt ?? null;
}

export function nextSubscriptionPaymentAt(
  lastApprovedAt: string | null | undefined,
  cooldownDays: number,
): Date | null {
  if (!lastApprovedAt) return null;
  const parsed = new Date(lastApprovedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  const next = new Date(parsed.getTime());
  next.setUTCDate(next.getUTCDate() + cooldownDays);
  return next;
}

export function isSubscriptionPaymentOnCooldown(
  lastApprovedAt: string | null | undefined,
  cooldownDays: number,
  now: Date = new Date(),
): boolean {
  const next = nextSubscriptionPaymentAt(lastApprovedAt, cooldownDays);
  return next != null && now.getTime() < next.getTime();
}
