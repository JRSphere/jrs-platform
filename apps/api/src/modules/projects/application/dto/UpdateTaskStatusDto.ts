import { TaskStatus } from '../../domain/value-objects/TaskStatus';

export interface UpdateTaskStatusDto {
  taskId: string;
  actorId: string;
  status: TaskStatus;
}
