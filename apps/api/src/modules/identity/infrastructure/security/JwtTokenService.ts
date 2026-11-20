import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../application/ports/TokenService';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: { sub: string; role: string }): Promise<string> {
    return this.jwt.signAsync(payload);
  }
}