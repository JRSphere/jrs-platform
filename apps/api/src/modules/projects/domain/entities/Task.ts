import { randomUUID } from 'crypto';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { canTransition, TaskStatus } from '../value-objects/TaskStatus';

export interface CreateTaskProps {
  title: string;
  projectId: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
}

export interface RestoreTaskProps {
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

export class Task {
  readonly id: string;
  readonly projectId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: RestoreTaskProps) {
    this.id = props.id;
    this.projectId = props.projectId;
    this.title = props.title;
    this.description = props.description;
    this.assigneeId = props.assigneeId;
    this.status = props.status;
    this.dueDate = props.dueDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateTaskProps): Task {
    const title = props.title.trim();
    if (title.length === 0) {
      throw new ValidationException('Task title is required');
    }
    if (title.length > 255) {
      throw new ValidationException('Task title cannot exceed 255 characters');
    }
    if (props.projectId.trim().length === 0) {
      throw new ValidationException('Project ID is required');
    }
    if (props.assigneeId != null && props.assigneeId.trim().length === 0) {
      throw new ValidationException('Assignee ID is required');
    }

    const now = new Date();
    return new Task({
      id: randomUUID(),
      projectId: props.projectId,
      title,
      description: props.description ?? null,
      assigneeId: props.assigneeId ?? null,
      status: TaskStatus.TODO,
      dueDate: props.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: RestoreTaskProps): Task {
    return new Task(props);
  }

  changeStatus(next: TaskStatus): void {
    if (!canTransition(this.status, next)) {
      throw new ValidationException(`Cannot move task from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = new Date();
  }

  assign(assigneeId: string): void {
    if (assigneeId.trim().length === 0) {
      throw new ValidationException('Assignee ID is required');
    }
    this.assigneeId = assigneeId;
    this.updatedAt = new Date();
  }

  unassign(): void {
    this.assigneeId = null;
    this.updatedAt = new Date();
  }
}
