/**
 * Canonical business settings — maps to `business_settings` table.
 * `settings` is a flexible JSON document for org preferences.
 */
export interface BusinessSettings {
  id: string;
  organizationId: string;
  settings: BusinessSettingsPayload;
  updatedAt?: string;
}

export interface BusinessSettingsPayload {
  autoCallNext?: boolean;
  allowWalkIns?: boolean;
  defaultPriority?: 'normal' | 'priority' | 'urgent';
  notifyOnJoin?: boolean;
  estimatedWaitVisible?: boolean;
  soundEnabled?: boolean;
  [key: string]: unknown;
}
