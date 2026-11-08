import { TaskCompletedEvent } from '../../domain/events/TaskCompletedEvent';
import { Task } from '../../domain/entities/Task';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { TaskResponseDto } from '../dto/TaskResponseDto';
import { UpdateTaskStatusDto } from '../dto/UpdateTaskStatusDto';
import { IEventPublisher } from '../ports/IEventPublisher';
import { ITaskRepository } from '../ports/ITaskRepository';
import { TaskAccess } from '../TaskAccess';

export class UpdateTaskStatusUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly events: IEventPublisher,
    private readonly access: TaskAccess,
  ) {}

  async execute(input: UpdateTaskStatusDto): Promise<TaskResponseDto> {
    const task = await this.access.loadOwnedTask(input.taskId, input.actorId);

    task.changeStatus(input.status);
    const updated = await this.tasks.update(task);
    if (updated.status === TaskStatus.DONE) {
      await this.events.publish(new TaskCompletedEvent(updated.id, updated.projectId));
    }
    return this.toResponse(updated);
  }

  private toResponse(task: Task): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
