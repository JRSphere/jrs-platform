import { describe, it, expect } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase';
import { IUserRepository } from '../ports/IUserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { User } from '../../domain/entities/User';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { ConflictException } from '../../../../shared-kernel/exceptions/ConflictException';

class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, User>();

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

const validInput = {
  email: 'Alice@Example.com',
  password: 'Secret123',
  firstName: 'Alice',
  lastName: 'Rahman',
};

describe('RegisterUserUseCase', () => {
  it('registers a user with a normalised email', async () => {
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository(), new FakePasswordHasher());

    const result = await useCase.execute(validInput);

    expect(result.email).toBe('alice@example.com');
    expect(result.firstName).toBe('Alice');
    expect(result.isActive).toBe(true);
  });

  it('never returns the password or its hash', async () => {
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository(), new FakePasswordHasher());

    const result = await useCase.execute(validInput);

    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('password');
  });

  it('stores the hashed password, not the plain one', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new RegisterUserUseCase(repo, new FakePasswordHasher());

    const result = await useCase.execute(validInput);
    const stored = await repo.findById(result.id);

    expect(stored?.passwordHash).toBe('hashed:Secret123');
  });

  it('rejects a password that breaks the password rules', async () => {
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository(), new FakePasswordHasher());

    await expect(
      useCase.execute({ ...validInput, password: 'short' }),
    ).rejects.toThrow(ValidationException);
  });

  it('rejects a duplicate email, ignoring case', async () => {
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository(), new FakePasswordHasher());

    await useCase.execute(validInput);

    await expect(
      useCase.execute({ ...validInput, email: 'ALICE@example.com' }),
    ).rejects.toThrow(ConflictException);
  });
});