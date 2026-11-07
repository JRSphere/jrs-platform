import { ApiProperty } from '@nestjs/swagger';
import { ProjectResponse } from './ProjectResponse';

export class ProjectPageResponse {
  @ApiProperty({ type: ProjectResponse, isArray: true })
  items!: ProjectResponse[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  limit!: number;
}
