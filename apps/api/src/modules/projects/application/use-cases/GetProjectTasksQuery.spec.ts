import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';
import { GetProjectTasksQuery } from './GetProjectTasksQuery';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private readonly projects: Project[]) {}
  async save(project: Project): Promise<Project> { return project; }
  async findById(id: string): Promise<Project | null> {
    return this.projects.find((project) => project.id === id) ?? null;
  }
  async findAll(): Promise<Project[]> { return this.projects; }
  async update(project: Project): Promise<Project> { return project; }
  async delete(): Promise<void> {}
}

class TaskRepositoryFake implements ITaskRepository {
  constructor(private readonly tasks: Task[]) {}
  async save(task: Task): Promise<Task> { return task; }
  async findById(id: string): Promise<Task | null> {
    return this.tasks.find((task) => task.id === id) ?? null;
  }
  async findByProjectId(projectId: string): Promise<Task[]> {
    return this.tasks.filter((task) => task.projectId === projectId);
  }
  async update(task: Task): Promise<Task> { return task; }
  async delete(): Promise<void> {}
}

describe('GetProjectTasksQuery', () => {
  it('returns only the requested project tasks as response DTOs', async () => {
    const first = Project.create({ name: 'First', ownerId: 'owner-1' });
    const second = Project.create({ name: 'Second', ownerId: 'owner-1' });
    const tasks = [
      Task.create({ projectId: first.id, title: 'First task' }),
      Task.create({ projectId: second.id, title: 'Second task' }),
    ];
    const result = await new GetProjectTasksQuery(
      new ProjectRepositoryFake([first, second]), new TaskRepositoryFake(tasks),
    ).execute(first.id);

    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe(first.id);
    expect(result[0].title).toBe('First task');
  });

  it('throws NotFoundException for an unknown project', async () => {
    const query = new GetProjectTasksQuery(
      new ProjectRepositoryFake([]), new TaskRepositoryFake([]),
    );

    await expect(query.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
