import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/ports/PasswordHasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 12;

  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}