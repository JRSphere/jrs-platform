import { TaskStatus } from '../../domain/value-objects/TaskStatus';

export interface UpdateTaskStatusDto {
  taskId: string;
  status: TaskStatus;
}
