export type MicrophonePermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'restricted'
  | 'unavailable';

export interface MicrophonePermissionService {
  getPermissionStatus(): Promise<MicrophonePermissionStatus>;
  isPermissionGranted(): Promise<boolean>;
  /**
   * Requests OS permission when status is undetermined.
   * Does not repeatedly prompt after a permanent denial.
   */
  requestPermission(): Promise<MicrophonePermissionStatus>;
  /** Opens OS app settings when the user previously denied permission. */
  openSystemSettings(): Promise<void>;
}
