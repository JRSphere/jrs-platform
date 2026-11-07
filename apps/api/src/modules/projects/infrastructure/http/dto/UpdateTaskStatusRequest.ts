import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../../domain/value-objects/TaskStatus';

export class UpdateTaskStatusRequest {
  @IsEnum(TaskStatus)
  @ApiProperty({ enum: TaskStatus, enumName: 'TaskStatus' })
  status!: TaskStatus;
}
