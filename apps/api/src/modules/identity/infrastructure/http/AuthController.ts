import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { UserResponseDto } from '../../application/dto/UserResponseDto';
import { RegisterUserRequest } from './dto/RegisterUserRequest';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserRequest): Promise<UserResponseDto> {
    return this.registerUser.execute(body);
  }
}