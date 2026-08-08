/**
 * Placeholder interfaces for future platform capabilities.
 * Implementations intentionally throw / no-op until wired.
 */

export type Unsubscribe = () => void;

/** Realtime channel subscription (Supabase Realtime). */
export interface RealtimeService {
  subscribeToQueue(
    queueId: string,
    onUpdate: (payload: unknown) => void,
  ): Unsubscribe;
  subscribeToTicket(
    ticketId: string,
    onUpdate: (payload: unknown) => void,
  ): Unsubscribe;
  subscribeToNotifications(
    userId: string,
    onUpdate: (payload: unknown) => void,
  ): Unsubscribe;
}

/** Push notification registration & delivery. */
export interface PushNotificationService {
  registerDevice(userId: string, token: string): Promise<void>;
  unregisterDevice(token: string): Promise<void>;
  sendLocalNotification(title: string, body: string): Promise<void>;
}

/** QR code generation & validation for tickets. */
export interface QrValidationService {
  generatePayload(ticketId: string): Promise<string>;
  validate(payload: string): Promise<{ valid: boolean; ticketId?: string }>;
}

/** Avatar / org logo storage (Supabase Storage). */
export interface FileStorageService {
  uploadAvatar(userId: string, uri: string): Promise<string>;
  uploadOrganizationLogo(organizationId: string, uri: string): Promise<string>;
  getPublicUrl(path: string): string;
}

export class UnimplementedRealtimeService implements RealtimeService {
  subscribeToQueue() {
    return () => undefined;
  }
  subscribeToTicket() {
    return () => undefined;
  }
  subscribeToNotifications() {
    return () => undefined;
  }
}

export class UnimplementedPushNotificationService
  implements PushNotificationService
{
  async registerDevice() {
    /* no-op */
  }
  async unregisterDevice() {
    /* no-op */
  }
  async sendLocalNotification() {
    /* no-op */
  }
}

export class UnimplementedQrValidationService implements QrValidationService {
  async generatePayload(ticketId: string) {
    return `meribaari://ticket/${ticketId}`;
  }
  async validate(payload: string) {
    const match = /^meribaari:\/\/ticket\/(.+)$/.exec(payload);
    return match
      ? { valid: true, ticketId: match[1] }
      : { valid: false };
  }
}

export class UnimplementedFileStorageService implements FileStorageService {
  async uploadAvatar(_userId: string, _uri: string): Promise<string> {
    throw new Error('File storage is not configured yet.');
  }
  async uploadOrganizationLogo(
    _organizationId: string,
    _uri: string,
  ): Promise<string> {
    throw new Error('File storage is not configured yet.');
  }
  getPublicUrl(path: string) {
    return path;
  }
}
