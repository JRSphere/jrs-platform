import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ type: String, maxLength: 255 })
  name!: string;

  @IsUUID()
  @ApiProperty({ type: String, format: 'uuid' })
  ownerId!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
}
