import { User } from '../../domain/entities/User';
import { Password } from '../../domain/value-objects/Password';
import { ConflictException } from '../../../../shared-kernel/exceptions/ConflictException';
import { IUserRepository } from '../ports/IUserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { RegisterUserDto } from '../dto/RegisterUserDto';
import { UserResponseDto } from '../dto/UserResponseDto';

export class RegisterUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserDto): Promise<UserResponseDto> {
    // Password rules live only in the Password value object.
    Password.create(input.password);

    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.create({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const saved = await this.users.save(user);

    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      role: saved.role,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}