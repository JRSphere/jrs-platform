export interface UpdateTaskDetailsDto {
  taskId: string;
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
}
