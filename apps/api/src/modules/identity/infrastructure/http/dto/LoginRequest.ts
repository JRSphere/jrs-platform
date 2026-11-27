import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ type: String, format: 'email', maxLength: 255 })
  email!: string;

  @IsString()
  @MaxLength(128)
  @ApiProperty({ type: String, maxLength: 128 })
  password!: string;
}