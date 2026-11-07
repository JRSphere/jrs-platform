import { Project } from '../../domain/entities/Project';
import { CreateProjectDto } from '../dto/CreateProjectDto';
import { ProjectResponseDto } from '../dto/ProjectResponseDto';
import { IProjectRepository } from '../ports/IProjectRepository';

export class CreateProjectUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(input: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = Project.create(input);
    const saved = await this.projects.save(project);
    return this.toResponse(saved);
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
