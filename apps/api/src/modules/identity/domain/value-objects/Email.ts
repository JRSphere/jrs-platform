export class Email {
  readonly value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Invalid email address');
    }
    this.value = email.toLowerCase();
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this.value;
  }
}