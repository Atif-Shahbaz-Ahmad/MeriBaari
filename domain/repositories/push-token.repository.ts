export type PushPlatform = 'android' | 'ios' | 'web';

export interface PushTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: PushPlatform;
  deviceName: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPushTokenInput {
  token: string;
  platform: PushPlatform;
  deviceName?: string | null;
}

export interface PushTokenRepository {
  registerToken(input: RegisterPushTokenInput): Promise<string | null>;
  deactivateToken(token: string): Promise<void>;
  listActiveTokens(): Promise<PushTokenRecord[]>;
}
