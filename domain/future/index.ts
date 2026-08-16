/**
 * Placeholder interfaces for future platform capabilities.
 * Realtime is implemented for queues/tickets (Prompt 4.6).
 * Push registration is implemented (Prompt 4.8).
 * Avatar storage is implemented via FileStorageService (Supabase Storage / mock).
 */

export type Unsubscribe = () => void;

export type RealtimeChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePostgresPayload<T = Record<string, unknown>> {
  eventType: RealtimeChangeEvent;
  schema: string;
  table: string;
  new: T | null;
  old: T | null;
  commitTimestamp?: string;
}

export type RealtimeConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/** Realtime channel subscription (Supabase Realtime). */
export interface RealtimeService {
  subscribeToQueue(
    queueId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe;

  subscribeToQueueEntries(
    queueId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe;

  subscribeToTicket(
    ticketId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe;

  /** Customer-scoped: all tickets for the authenticated user. */
  subscribeToMyTickets(
    userId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe;

  /** Business-scoped: queues belonging to an organization. */
  subscribeToOrganizationQueues(
    organizationId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe;

  /** Authenticated user's notifications only. */
  subscribeToNotifications(
    userId: string,
    onUpdate: (payload: RealtimePostgresPayload) => void,
  ): Unsubscribe;

  /** Fired when a previously-open connection recovers. */
  onReconnect(callback: () => void): Unsubscribe;

  getConnectionStatus(): RealtimeConnectionStatus;

  /** Tear down every authenticated channel (logout / session end). */
  unsubscribeAll(): void;
}

/** Push notification registration (client). Delivery is server-side only. */
export interface PushNotificationService {
  ensureAndroidChannel(): Promise<void>;
  getExpoPushToken(): Promise<string | null>;
  /** Register / reassign this device for the authenticated user when permitted. */
  registerForUser(userId: string): Promise<string | null>;
  registerDevice(userId: string, token: string): Promise<void>;
  unregisterDevice(token?: string): Promise<void>;
  /** Soft-deactivate current device token (logout / account switch). */
  deactivateCurrentDevice(): Promise<void>;
  sendLocalNotification(title: string, body: string): Promise<void>;
  getCachedToken(): string | null;
}

/** Avatar / org logo storage (Supabase Storage). */
export interface FileStorageService {
  /**
   * Optimize + upload an avatar.
   * Returns a public URL suitable for `profiles.avatar_url`.
   */
  uploadAvatar(userId: string, uri: string): Promise<string>;
  /** Delete the user's avatar object from storage (idempotent). */
  removeAvatar(userId: string, avatarUrl?: string | null): Promise<void>;
  /** Optimize + upload org logo → public URL for `organizations.logo_url`. */
  uploadOrganizationLogo(organizationId: string, uri: string): Promise<string>;
  /** Delete org logo object from storage (idempotent). */
  removeOrganizationLogo(
    organizationId: string,
    logoUrl?: string | null,
  ): Promise<void>;
  /**
   * Optimize + upload a private payment screenshot.
   * Returns the storage object path (never a public URL).
   */
  uploadPaymentProof(userId: string, uri: string): Promise<string>;
  /** Time-limited signed URL for a private payment-proof object. */
  createPaymentProofSignedUrl(path: string, expiresInSeconds?: number): Promise<string | null>;
  getPublicUrl(path: string): string;
}

export class UnimplementedRealtimeService implements RealtimeService {
  subscribeToQueue() {
    return () => undefined;
  }
  subscribeToQueueEntries() {
    return () => undefined;
  }
  subscribeToTicket() {
    return () => undefined;
  }
  subscribeToMyTickets() {
    return () => undefined;
  }
  subscribeToOrganizationQueues() {
    return () => undefined;
  }
  subscribeToNotifications() {
    return () => undefined;
  }
  onReconnect() {
    return () => undefined;
  }
  getConnectionStatus(): RealtimeConnectionStatus {
    return 'idle';
  }
  unsubscribeAll() {
    /* no-op */
  }
}

export class UnimplementedPushNotificationService
  implements PushNotificationService
{
  async ensureAndroidChannel() {
    /* no-op */
  }
  async getExpoPushToken() {
    return null;
  }
  async registerForUser() {
    return null;
  }
  async registerDevice() {
    /* no-op */
  }
  async unregisterDevice() {
    /* no-op */
  }
  async deactivateCurrentDevice() {
    /* no-op */
  }
  async sendLocalNotification() {
    /* no-op */
  }
  getCachedToken() {
    return null;
  }
}

export class UnimplementedFileStorageService implements FileStorageService {
  async uploadAvatar(_userId: string, _uri: string): Promise<string> {
    throw new Error('File storage is not configured yet.');
  }
  async removeAvatar(_userId: string, _avatarUrl?: string | null): Promise<void> {
    /* no-op */
  }
  async uploadOrganizationLogo(
    _organizationId: string,
    _uri: string,
  ): Promise<string> {
    throw new Error('File storage is not configured yet.');
  }
  async removeOrganizationLogo(
    _organizationId: string,
    _logoUrl?: string | null,
  ): Promise<void> {
    /* no-op */
  }
  async uploadPaymentProof(_userId: string, _uri: string): Promise<string> {
    throw new Error('File storage is not configured yet.');
  }
  async createPaymentProofSignedUrl(
    _path: string,
    _expiresInSeconds?: number,
  ): Promise<string | null> {
    return null;
  }
  getPublicUrl(path: string) {
    return path;
  }
}
