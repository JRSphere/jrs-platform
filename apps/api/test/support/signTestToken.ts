import { JwtService } from '@nestjs/jwt';

export function tokenFor(userId: string, role = 'EMPLOYEE'): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required to sign e2e test tokens');
  }
  return new JwtService({ secret }).sign({ sub: userId, role });
}
