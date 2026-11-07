import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { IProjectRepository } from '../ports/IProjectRepository';

export class DeleteProjectUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(projectId: string): Promise<void> {
    const project = await this.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projects.delete(projectId);
  }
}
