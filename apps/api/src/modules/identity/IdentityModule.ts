import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../infrastructure/prisma/PrismaModule';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import { JwtTokenService } from './infrastructure/security/JwtTokenService';
import { AuthController } from './infrastructure/http/AuthController';
import { JwtAuthGuard } from '../../infrastructure/http/auth/JwtAuthGuard';
import { IUserRepository } from './application/ports/IUserRepository';
import { PasswordHasher, PASSWORD_HASHER } from './application/ports/PasswordHasher';
import { TOKEN_SERVICE } from './application/ports/TokenService';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from './application/use-cases/LoginUserUseCase';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: RegisterUserUseCase,
      useFactory: (users: IUserRepository, hasher: PasswordHasher) =>
        new RegisterUserUseCase(users, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (users: IUserRepository, hasher: PasswordHasher) =>
        new LoginUserUseCase(users, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
  ],
  exports: [RegisterUserUseCase, LoginUserUseCase],
})
export class IdentityModule {}