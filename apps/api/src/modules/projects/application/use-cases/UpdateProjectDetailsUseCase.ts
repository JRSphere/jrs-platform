import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../../domain/entities/Project';
import { ProjectResponseDto } from '../dto/ProjectResponseDto';
import { UpdateProjectDetailsDto } from '../dto/UpdateProjectDetailsDto';
import { IProjectRepository } from '../ports/IProjectRepository';

export class UpdateProjectDetailsUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(input: UpdateProjectDetailsDto): Promise<ProjectResponseDto> {
    const project = await this.projects.findById(input.projectId);
    if (!project || !project.isOwnedBy(input.actorId)) {
      throw new NotFoundException('Project not found');
    }

    project.updateDetails({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
    });
    const updated = await this.projects.update(project);
    return this.toResponse(updated);
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
