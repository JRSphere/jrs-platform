import { TaskStatus } from '../../domain/value-objects/TaskStatus';

export interface TaskResponseDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
