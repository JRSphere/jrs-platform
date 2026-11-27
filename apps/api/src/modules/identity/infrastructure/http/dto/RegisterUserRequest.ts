import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserRequest {
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ type: String, format: 'email', maxLength: 255 })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiProperty({ type: String, minLength: 8, maxLength: 128 })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty({ type: String, minLength: 1, maxLength: 100 })
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty({ type: String, minLength: 1, maxLength: 100 })
  lastName!: string;
}