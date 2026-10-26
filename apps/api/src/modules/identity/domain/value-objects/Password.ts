import * as bcrypt from 'bcrypt';

export class Password {
  readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  static async create(plainPassword: string): Promise<Password> {
    if (plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(plainPassword)) {
      throw new Error('Password must contain uppercase letter');
    }
    if (!/[0-9]/.test(plainPassword)) {
      throw new Error('Password must contain number');
    }

    const hash = await bcrypt.hash(plainPassword, 10);
    return new Password(hash);
  }

  async verify(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hash);
  }
}