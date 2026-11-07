import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Task } from '../../domain/entities/Task';
import { TaskResponseDto } from '../dto/TaskResponseDto';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';

export class GetProjectTasksQuery {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly tasks: ITaskRepository,
  ) {}

  async execute(projectId: string): Promise<TaskResponseDto[]> {
    const project = await this.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const tasks = await this.tasks.findByProjectId(projectId);
    return tasks.map((task) => this.toResponse(task));
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
