export interface UpdateTaskDetailsDto {
  taskId: string;
  actorId: string;
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
}
