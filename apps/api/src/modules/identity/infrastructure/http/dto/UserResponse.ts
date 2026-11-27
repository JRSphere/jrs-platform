import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../../application/dto/UserResponseDto';

export class UserResponse implements UserResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'email' })
  email!: string;

  @ApiProperty({ type: String })
  firstName!: string;

  @ApiProperty({ type: String })
  lastName!: string;

  @ApiProperty({ type: String })
  role!: string;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
