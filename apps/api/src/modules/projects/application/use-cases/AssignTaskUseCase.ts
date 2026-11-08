import { TaskAssignedEvent } from '../../domain/events/TaskAssignedEvent';
import { Task } from '../../domain/entities/Task';
import { AssignTaskDto } from '../dto/AssignTaskDto';
import { TaskResponseDto } from '../dto/TaskResponseDto';
import { IEventPublisher } from '../ports/IEventPublisher';
import { ITaskRepository } from '../ports/ITaskRepository';
import { TaskAccess } from '../TaskAccess';

export class AssignTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly events: IEventPublisher,
    private readonly access: TaskAccess,
  ) {}

  async execute(input: AssignTaskDto): Promise<TaskResponseDto> {
    const task = await this.access.loadOwnedTask(input.taskId, input.actorId);

    task.assign(input.assigneeId);
    const updated = await this.tasks.update(task);
    const assigneeId = updated.assigneeId;
    if (assigneeId === null) {
      throw new Error('Assigned task is missing its assignee');
    }
    await this.events.publish(new TaskAssignedEvent(updated.id, updated.projectId, assigneeId));
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
