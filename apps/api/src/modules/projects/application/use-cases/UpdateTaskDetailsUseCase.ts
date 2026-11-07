import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Task } from '../../domain/entities/Task';
import { TaskResponseDto } from '../dto/TaskResponseDto';
import { UpdateTaskDetailsDto } from '../dto/UpdateTaskDetailsDto';
import { ITaskRepository } from '../ports/ITaskRepository';

export class UpdateTaskDetailsUseCase {
  constructor(private readonly tasks: ITaskRepository) {}

  async execute(input: UpdateTaskDetailsDto): Promise<TaskResponseDto> {
    const task = await this.tasks.findById(input.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.updateDetails({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    });
    const updated = await this.tasks.update(task);
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
