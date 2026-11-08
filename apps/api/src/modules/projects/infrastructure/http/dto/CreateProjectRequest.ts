import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ type: String, maxLength: 255 })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
}
