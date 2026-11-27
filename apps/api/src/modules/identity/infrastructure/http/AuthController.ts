import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { TOKEN_SERVICE, type TokenService } from '../../application/ports/TokenService';
import { UserResponseDto } from '../../application/dto/UserResponseDto';
import { RegisterUserRequest } from './dto/RegisterUserRequest';
import { LoginRequest } from './dto/LoginRequest';
import { Public } from '../../../../infrastructure/http/auth/Public';
import { LoginResponseBody } from './dto/LoginResponseBody';
import { UserResponse } from './dto/UserResponse';

export interface LoginResponse {
  accessToken: string;
}

@Controller('api/v1/auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
        @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiBadRequestResponse({ description: 'Invalid registration details' })
  @ApiConflictResponse({ description: 'A user with this email already exists' })
  async register(@Body() body: RegisterUserRequest): Promise<UserResponseDto> {
    return this.registerUser.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Log in' })
  @ApiOkResponse({ type: LoginResponseBody })
  @ApiBadRequestResponse({ description: 'Invalid login details' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    const user = await this.loginUser.execute(body.email, body.password);
    const accessToken = await this.tokens.sign({ sub: user.userId, role: user.role });
    return { accessToken };
  }
}