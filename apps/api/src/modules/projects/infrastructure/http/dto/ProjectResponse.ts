import { ApiProperty } from '@nestjs/swagger';
import { ProjectResponseDto } from '../../../application/dto/ProjectResponseDto';

export class ProjectResponse implements ProjectResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, maxLength: 255 })
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
