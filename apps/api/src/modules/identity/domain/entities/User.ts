import { randomUUID } from 'crypto';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export class User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  private constructor(
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
  ) {
    this.id = randomUUID();
    this.email = email;
    this.passwordHash = passwordHash;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = UserRole.EMPLOYEE;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
  ): User {
    // Validation
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    if (!passwordHash || passwordHash.length < 20) {
      throw new Error('Password hash invalid');
    }

    return new User(email, passwordHash, firstName, lastName);
  }

  getFullName(): string {
    return \\ \\;
  }

  setRole(role: UserRole): void {
    this.role = role;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }
}
