import { ApiProperty } from '@nestjs/swagger';
import type { LoginResponse } from '../AuthController';

export class LoginResponseBody implements LoginResponse {
  @ApiProperty({ type: String })
  accessToken!: string;
}
