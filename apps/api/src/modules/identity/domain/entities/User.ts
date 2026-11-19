import { randomUUID } from 'crypto';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface CreateUserProps {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

export interface RestoreUserProps extends CreateUserProps {
  id: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  role: UserRole;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: CreateUserProps, id: string, createdAt: Date) {
    this.id = id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.role = UserRole.EMPLOYEE;
    this.isActive = true;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }

  static create(props: CreateUserProps): User {
    const email = props.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationException('Invalid email address');
    }
    if (props.firstName.trim().length === 0) {
      throw new ValidationException('First name is required');
    }
    if (props.lastName.trim().length === 0) {
      throw new ValidationException('Last name is required');
    }
    return new User(
      { ...props, email, firstName: props.firstName.trim(), lastName: props.lastName.trim() },
      randomUUID(),
      new Date(),
    );
  }

  // Rebuilds a user from stored data. Used by repositories, not by use cases.
  static restore(props: RestoreUserProps): User {
    const user = new User(props, props.id, props.createdAt);
    user.role = props.role;
    user.isActive = props.isActive;
    user.updatedAt = props.updatedAt;
    return user;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  changeRole(role: UserRole): void {
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