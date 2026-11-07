import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskRequest {
  @IsUUID()
  @ApiProperty({ type: String, format: 'uuid' })
  assigneeId!: string;
}
