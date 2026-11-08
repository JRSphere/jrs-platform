import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../../domain/entities/Project';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { DeleteProjectUseCase } from './DeleteProjectUseCase';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private projects: Project[]) {}
  readonly deleted: string[] = [];

  async save(project: Project): Promise<Project> { this.projects.push(project); return project; }
  async findById(id: string): Promise<Project | null> {
    return this.projects.find((project) => project.id === id) ?? null;
  }
  async findAll(request: PageRequest, ownerId: string): Promise<Page<Project>> {
    const owned = this.projects.filter((project) => project.isOwnedBy(ownerId));
    return {
      items: owned.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: owned.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async update(project: Project): Promise<Project> { return project; }
  async delete(id: string): Promise<void> {
    this.deleted.push(id);
    this.projects = this.projects.filter((project) => project.id !== id);
  }
}

describe('DeleteProjectUseCase', () => {
  it('deletes an existing project', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const repository = new ProjectRepositoryFake([project]);

    await new DeleteProjectUseCase(repository).execute(project.id, 'owner-1');

    expect(repository.deleted).toEqual([project.id]);
  });

  it('throws NotFoundException and deletes nothing for an unknown project', async () => {
    const repository = new ProjectRepositoryFake([]);

    await expect(new DeleteProjectUseCase(repository).execute('missing', 'owner-1'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleted).toEqual([]);
  });

  it('throws NotFoundException when deleting the same project twice', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const repository = new ProjectRepositoryFake([project]);
    const useCase = new DeleteProjectUseCase(repository);
    await useCase.execute(project.id, 'owner-1');

    await expect(useCase.execute(project.id, 'owner-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleted).toEqual([project.id]);
  });

  it('hides another owner’s project and does not delete it', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const repository = new ProjectRepositoryFake([project]);

    await expect(new DeleteProjectUseCase(repository).execute(project.id, 'owner-2'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(await repository.findById(project.id)).toBe(project);
    expect(repository.deleted).toEqual([]);
  });
});
