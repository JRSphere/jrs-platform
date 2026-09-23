import { randomUUID } from 'crypto';

export class Session {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;

  private constructor(userId: string, refreshToken: string) {
    this.id = randomUUID();
    this.userId = userId;
    this.refreshToken = refreshToken;
    this.createdAt = new Date();
    // Refresh token expires in 7 days
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  static create(userId: string, refreshToken: string): Session {
    if (!userId) {
      throw new Error('User ID required');
    }
    if (!refreshToken) {
      throw new Error('Refresh token required');
    }
    return new Session(userId, refreshToken);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
