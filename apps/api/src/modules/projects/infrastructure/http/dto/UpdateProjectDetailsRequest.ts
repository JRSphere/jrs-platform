import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProjectDetailsRequest {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiPropertyOptional({ type: String, maxLength: 255 })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
}
