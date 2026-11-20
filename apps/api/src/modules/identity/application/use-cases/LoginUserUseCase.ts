import { IUserRepository } from '../ports/IUserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { UnauthorizedException } from '../../../../shared-kernel/exceptions/UnauthorizedException';

export interface LoginResult {
  userId: string;
  email: string;
  role: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    // Same message for unknown email and wrong password, so attackers can't tell which.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}