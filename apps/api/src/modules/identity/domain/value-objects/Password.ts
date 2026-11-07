import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';

export class Password {
  readonly plainValue: string;

  private constructor(plainValue: string) {
    this.plainValue = plainValue;
  }

  static create(plainPassword: string): Password {
    if (plainPassword.length < 8) {
      throw new ValidationException('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(plainPassword)) {
      throw new ValidationException('Password must contain an uppercase letter');
    }
    if (!/[0-9]/.test(plainPassword)) {
      throw new ValidationException('Password must contain a number');
    }
    return new Password(plainPassword);
  }
}