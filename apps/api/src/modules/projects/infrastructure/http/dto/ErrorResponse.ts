import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ type: Number })
  statusCode!: number;

  @ApiProperty({ type: String, description: 'Stable upper-case error code' })
  error!: string;

  @ApiProperty({ type: String })
  message!: string;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description: 'Field-level validation messages, present only for validation errors',
  })
  details?: string[];
}
