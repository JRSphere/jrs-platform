import { IsEnum } from 'class-validator';
import { TaskStatus } from '../../../domain/value-objects/TaskStatus';

export class UpdateTaskStatusRequest {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
