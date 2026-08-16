/**
 * MeriBaari subscription payment details.
 * Update this file to change bank / Easypaisa information shown to business owners.
 * No online payment gateway in this version — owners pay manually and upload proof.
 */
export const PAYMENT_CONFIG = {
  monthlySubscriptionPrice: 500,
  currency: 'PKR',
  currencyLabel: 'Rs',
  verificationHours: '2–3',
  /** Days after admin approval before another subscription payment may be submitted. */
  renewalCooldownDays: 31,
  bank: {
    name: 'Faysal Bank',
    accountTitle: 'Atif Ahmad',
    accountNumber: '3226301000005730',
    iban: 'PK45FAYS3226301000005730',
  },
  easypaisa: {
    accountTitle: 'Atif Ahmad',
    number: '03091486293',
  },
} as const;

export type PaymentConfig = typeof PAYMENT_CONFIG;

export function formatSubscriptionPrice(
  amount: number = PAYMENT_CONFIG.monthlySubscriptionPrice,
): string {
  return `${PAYMENT_CONFIG.currencyLabel} ${amount.toLocaleString('en-PK')}`;
}
