import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { TaskAssignedEvent } from '../../domain/events/TaskAssignedEvent';
import { TaskCreatedEvent } from '../../domain/events/TaskCreatedEvent';
import { Task } from '../../domain/entities/Task';
import { CreateTaskDto } from '../dto/CreateTaskDto';
import { TaskResponseDto } from '../dto/TaskResponseDto';
import { IEventPublisher } from '../ports/IEventPublisher';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';

export class CreateTaskUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly tasks: ITaskRepository,
    private readonly events: IEventPublisher,
  ) {}

  async execute(input: CreateTaskDto): Promise<TaskResponseDto> {
    const project = await this.projects.findById(input.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = Task.create(input);
    const saved = await this.tasks.save(task);
    await this.events.publish(new TaskCreatedEvent(saved.id, saved.projectId, saved.assigneeId));
    if (saved.assigneeId !== null) {
      await this.events.publish(
        new TaskAssignedEvent(saved.id, saved.projectId, saved.assigneeId),
      );
    }
    return this.toResponse(saved);
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
