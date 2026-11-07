import { IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ type: String, maxLength: 255 })
  title!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  assigneeId?: string | null;

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueDate?: string | null;
}
