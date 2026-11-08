import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Task } from '../../domain/entities/Task';
import { TaskResponseDto } from '../dto/TaskResponseDto';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';

export class GetProjectTasksQuery {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly tasks: ITaskRepository,
  ) {}

  async execute(
    projectId: string,
    request: PageRequest,
    actorId: string,
  ): Promise<Page<TaskResponseDto>> {
    const project = await this.projects.findById(projectId);
    if (!project || !project.isOwnedBy(actorId)) {
      throw new NotFoundException('Project not found');
    }
    const result = await this.tasks.findByProjectId(projectId, request);
    return {
      items: result.items.map((task) => this.toResponse(task)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
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
