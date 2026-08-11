/**
 * Notification permission statuses for MeriBaari push.
 * Maps Expo permission results to a stable domain vocabulary.
 */
export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'restricted'
  | 'unavailable';

export interface NotificationPermissionService {
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  isPermissionGranted(): Promise<boolean>;
  /**
   * Requests OS permission when status is undetermined.
   * Does not repeatedly prompt after a permanent denial.
   */
  requestPermission(): Promise<NotificationPermissionStatus>;
  /** Opens OS app settings when the user previously denied permission. */
  openSystemSettings(): Promise<void>;
}
