import type {
  PushTokenRepository,
  RegisterPushTokenInput,
} from '@/domain/repositories/push-token.repository';

export class MockPushTokenRepository implements PushTokenRepository {
  private tokens = new Map<string, RegisterPushTokenInput & { id: string; userId: string }>();

  async registerToken(input: RegisterPushTokenInput): Promise<string | null> {
    const id = `mock-push-${Date.now()}`;
    this.tokens.set(input.token, {
      ...input,
      id,
      userId: 'mock-user',
    });
    return id;
  }

  async deactivateToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async listActiveTokens() {
    return Array.from(this.tokens.values()).map((t) => ({
      id: t.id,
      userId: t.userId,
      token: t.token,
      platform: t.platform,
      deviceName: t.deviceName ?? null,
      isActive: true,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
}
