import { ApiProperty } from '@nestjs/swagger';
import { TaskResponse } from './TaskResponse';

export class TaskPageResponse {
  @ApiProperty({ type: TaskResponse, isArray: true })
  items!: TaskResponse[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  limit!: number;
}
