import { Project } from '../../domain/entities/Project';
import { Page, PageRequest } from '../dto/Pagination';
import { ProjectResponseDto } from '../dto/ProjectResponseDto';
import { IProjectRepository } from '../ports/IProjectRepository';

export class ListProjectsQuery {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(request: PageRequest, actorId: string): Promise<Page<ProjectResponseDto>> {
    const result = await this.projects.findAll(request, actorId);
    return {
      items: result.items.map((project) => this.toResponse(project)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  private toResponse(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
