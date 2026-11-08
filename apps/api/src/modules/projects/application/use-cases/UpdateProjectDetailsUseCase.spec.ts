import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Project } from '../../domain/entities/Project';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { UpdateProjectDetailsUseCase } from './UpdateProjectDetailsUseCase';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private readonly project: Project | null) {}
  readonly updated: Project[] = [];

  async save(project: Project): Promise<Project> { return project; }
  async findById(id: string): Promise<Project | null> {
    return this.project?.id === id ? this.project : null;
  }
  async findAll(request: PageRequest, ownerId: string): Promise<Page<Project>> {
    const items = this.project?.isOwnedBy(ownerId) ? [this.project] : [];
    return {
      items: items.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: items.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async update(project: Project): Promise<Project> { this.updated.push(project); return project; }
  async delete(): Promise<void> {}
}

const createProject = () =>
  Project.create({
    name: 'Original',
    ownerId: 'owner-1',
    description: 'Existing details',
  });

describe('UpdateProjectDetailsUseCase', () => {
  it('updates details and returns the response DTO', async () => {
    const project = createProject();
    const repository = new ProjectRepositoryFake(project);
    const result = await new UpdateProjectDetailsUseCase(repository).execute({
      projectId: project.id,
      actorId: 'owner-1',
      name: 'Updated',
      description: 'New details',
    });

    expect(repository.updated).toHaveLength(1);
    expect(result).toMatchObject({
      id: project.id,
      name: 'Updated',
      description: 'New details',
    });
  });

  it('leaves omitted fields unchanged', async () => {
    const project = createProject();
    const result = await new UpdateProjectDetailsUseCase(
      new ProjectRepositoryFake(project),
    ).execute({ projectId: project.id, actorId: 'owner-1', name: 'Updated' });

    expect(result.name).toBe('Updated');
    expect(result.description).toBe('Existing details');
  });

  it('throws NotFoundException for an unknown project', async () => {
    await expect(
      new UpdateProjectDetailsUseCase(new ProjectRepositoryFake(null)).execute({
        projectId: 'missing',
        actorId: 'owner-1',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ValidationException without updating for an invalid name', async () => {
    const project = createProject();
    const repository = new ProjectRepositoryFake(project);

    await expect(
      new UpdateProjectDetailsUseCase(repository).execute({
        projectId: project.id,
        actorId: 'owner-1',
        name: ' ',
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(repository.updated).toHaveLength(0);
  });

  it('hides another owner’s project and does not update it', async () => {
    const project = createProject();
    const repository = new ProjectRepositoryFake(project);

    await expect(new UpdateProjectDetailsUseCase(repository).execute({
      projectId: project.id,
      actorId: 'owner-2',
      name: 'Changed',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(project.name).toBe('Original');
    expect(repository.updated).toHaveLength(0);
  });
});
