import { describe, expect, it } from 'vitest';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Project } from '../../domain/entities/Project';
import { IProjectRepository } from '../ports/IProjectRepository';
import { CreateProjectUseCase } from './CreateProjectUseCase';

class ProjectRepositoryFake implements IProjectRepository {
  readonly saved: Project[] = [];

  async save(project: Project): Promise<Project> {
    this.saved.push(project);
    return project;
  }

  async findById(): Promise<Project | null> {
    return null;
  }

  async findAll(): Promise<Project[]> {
    return this.saved;
  }

  async update(project: Project): Promise<Project> {
    return project;
  }

  async delete(): Promise<void> {}
}

describe('CreateProjectUseCase', () => {
  it('saves the project and returns its response DTO', async () => {
    const projects = new ProjectRepositoryFake();
    const result = await new CreateProjectUseCase(projects).execute({
      name: 'Platform',
      ownerId: 'owner-1',
    });

    expect(projects.saved).toHaveLength(1);
    expect(result).toEqual({
      id: projects.saved[0].id,
      name: 'Platform',
      description: null,
      ownerId: 'owner-1',
      createdAt: projects.saved[0].createdAt,
      updatedAt: projects.saved[0].updatedAt,
    });
  });

  it('rejects an empty project name with ValidationException', async () => {
    const projects = new ProjectRepositoryFake();

    await expect(
      new CreateProjectUseCase(projects).execute({ name: '', ownerId: 'owner-1' }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(projects.saved).toHaveLength(0);
  });
});
