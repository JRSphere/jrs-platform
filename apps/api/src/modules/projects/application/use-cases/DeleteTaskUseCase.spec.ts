import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';
import { TaskAccess } from '../TaskAccess';
import { DeleteTaskUseCase } from './DeleteTaskUseCase';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private readonly project: Project | null) {}
  async save(project: Project): Promise<Project> { return project; }
  async findById(id: string): Promise<Project | null> {
    return this.project?.id === id ? this.project : null;
  }
  async findAll(request: PageRequest, ownerId: string): Promise<Page<Project>> {
    const items = this.project?.isOwnedBy(ownerId) ? [this.project] : [];
    return { items, total: items.length, page: request.page, limit: request.limit };
  }
  async update(project: Project): Promise<Project> { return project; }
  async delete(): Promise<void> {}
}

class TaskRepositoryFake implements ITaskRepository {
  constructor(private readonly tasks: Task[]) {}
  readonly deleted: string[] = [];

  async save(task: Task): Promise<Task> { this.tasks.push(task); return task; }
  async findById(id: string): Promise<Task | null> {
    return this.tasks.find((task) => task.id === id) ?? null;
  }
  async findByProjectId(projectId: string, request: PageRequest): Promise<Page<Task>> {
    const items = this.tasks.filter((task) => task.projectId === projectId);
    return {
      items: items.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: items.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async update(task: Task): Promise<Task> { return task; }
  async delete(id: string): Promise<void> {
    this.deleted.push(id);
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index >= 0) {
      this.tasks.splice(index, 1);
    }
  }
}

describe('DeleteTaskUseCase', () => {
  it('deletes an existing task', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = Task.create({ projectId: project.id, title: 'Review' });
    const repository = new TaskRepositoryFake([task]);

    await new DeleteTaskUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
    ).execute(task.id, 'owner-1');

    expect(repository.deleted).toEqual([task.id]);
  });

  it('throws NotFoundException and deletes nothing for an unknown task', async () => {
    const repository = new TaskRepositoryFake([]);

    await expect(new DeleteTaskUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(null), repository),
    ).execute('missing', 'owner-1'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleted).toEqual([]);
  });

  it('throws NotFoundException when deleting the same task twice', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = Task.create({ projectId: project.id, title: 'Review' });
    const repository = new TaskRepositoryFake([task]);
    const useCase = new DeleteTaskUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
    );
    await useCase.execute(task.id, 'owner-1');

    await expect(useCase.execute(task.id, 'owner-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleted).toEqual([task.id]);
  });

  it('hides another owner’s task without deleting it', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = Task.create({ projectId: project.id, title: 'Review' });
    const repository = new TaskRepositoryFake([task]);

    await expect(new DeleteTaskUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
    ).execute(task.id, 'owner-2')).rejects.toBeInstanceOf(NotFoundException);
    expect(await repository.findById(task.id)).toBe(task);
    expect(repository.deleted).toEqual([]);
  });
});
