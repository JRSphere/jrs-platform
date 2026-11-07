import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';
import { GetProjectTasksQuery } from './GetProjectTasksQuery';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private readonly projects: Project[]) {}
  async save(project: Project): Promise<Project> { return project; }
  async findById(id: string): Promise<Project | null> {
    return this.projects.find((project) => project.id === id) ?? null;
  }
  async findAll(request: PageRequest): Promise<Page<Project>> {
    return {
      items: this.projects.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: this.projects.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async update(project: Project): Promise<Project> { return project; }
  async delete(): Promise<void> {}
}

class TaskRepositoryFake implements ITaskRepository {
  constructor(private readonly tasks: Task[]) {}
  async save(task: Task): Promise<Task> { return task; }
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
  async delete(): Promise<void> {}
}

describe('GetProjectTasksQuery', () => {
  it('returns the requested page as response DTOs with the full total', async () => {
    const first = Project.create({ name: 'First', ownerId: 'owner-1' });
    const second = Project.create({ name: 'Second', ownerId: 'owner-1' });
    const tasks = [
      Task.create({ projectId: first.id, title: 'First task' }),
      Task.create({ projectId: first.id, title: 'Second task' }),
      Task.create({ projectId: first.id, title: 'Third task' }),
      Task.create({ projectId: second.id, title: 'Second task' }),
    ];
    const result = await new GetProjectTasksQuery(
      new ProjectRepositoryFake([first, second]), new TaskRepositoryFake(tasks),
    ).execute(first.id, { page: 2, limit: 1 });

    expect(result).toMatchObject({
      total: 3,
      page: 2,
      limit: 1,
      items: [{ projectId: first.id, title: 'Second task' }],
    });
  });

  it('returns an empty page past the end with the actual total', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const tasks = [
      Task.create({ projectId: project.id, title: 'First' }),
      Task.create({ projectId: project.id, title: 'Second' }),
    ];
    const result = await new GetProjectTasksQuery(
      new ProjectRepositoryFake([project]), new TaskRepositoryFake(tasks),
    ).execute(project.id, { page: 2, limit: 2 });

    expect(result).toEqual({ items: [], total: 2, page: 2, limit: 2 });
  });

  it('throws NotFoundException for an unknown project', async () => {
    const query = new GetProjectTasksQuery(
      new ProjectRepositoryFake([]), new TaskRepositoryFake([]),
    );

    await expect(query.execute('missing', { page: 1, limit: 20 }))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
