import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/PrismaModule';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import { AuthController } from './infrastructure/http/AuthController';
import { IUserRepository } from './application/ports/IUserRepository';
import { PasswordHasher, PASSWORD_HASHER } from './application/ports/PasswordHasher';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    {
      provide: RegisterUserUseCase,
      useFactory: (users: IUserRepository, hasher: PasswordHasher) =>
        new RegisterUserUseCase(users, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
  ],
  exports: [RegisterUserUseCase],
})
export class IdentityModule {}