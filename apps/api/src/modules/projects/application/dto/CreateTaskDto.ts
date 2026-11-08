export interface CreateTaskDto {
  projectId: string;
  actorId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
}
