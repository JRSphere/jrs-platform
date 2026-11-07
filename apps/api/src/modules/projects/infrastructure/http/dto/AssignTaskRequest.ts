import { IsUUID } from 'class-validator';

export class AssignTaskRequest {
  @IsUUID()
  assigneeId!: string;
}
