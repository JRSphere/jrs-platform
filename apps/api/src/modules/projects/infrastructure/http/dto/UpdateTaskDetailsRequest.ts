import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateTaskDetailsRequest {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiPropertyOptional({ type: String, maxLength: 255 })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueDate?: string | null;
}
