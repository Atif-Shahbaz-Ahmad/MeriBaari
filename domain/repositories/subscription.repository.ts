import type {
  AdminBusinessSummary,
  AdminSubscriptionStats,
  SubmitSubscriptionPaymentInput,
  SubscriptionPayment,
  SubscriptionPaymentReview,
} from '@/domain/models/subscription';

export interface SubscriptionRepository {
  getLatestForOrganization(
    organizationId: string,
  ): Promise<SubscriptionPayment | null>;
  listForOrganization(organizationId: string): Promise<SubscriptionPayment[]>;
  submitPayment(
    input: Omit<SubmitSubscriptionPaymentInput, 'localProofUri'> & {
      paymentProofPath: string;
    },
  ): Promise<string>;
  listAdminPayments(status?: SubscriptionPayment['status'] | 'all'): Promise<
    SubscriptionPayment[]
  >;
  getAdminPayment(paymentId: string): Promise<SubscriptionPaymentReview | null>;
  getAdminStats(): Promise<AdminSubscriptionStats>;
  listAdminActiveBusinesses(): Promise<AdminBusinessSummary[]>;
  getAdminBusiness(organizationId: string): Promise<AdminBusinessSummary | null>;
  reviewPayment(
    paymentId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ): Promise<void>;
  setAdminVisibility(
    organizationId: string,
    visible: boolean,
    reason?: string,
  ): Promise<void>;
  createProofSignedUrl(path: string): Promise<string | null>;
}
