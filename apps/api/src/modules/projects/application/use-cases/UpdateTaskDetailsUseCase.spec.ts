import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';
import { TaskAccess } from '../TaskAccess';
import { UpdateTaskDetailsUseCase } from './UpdateTaskDetailsUseCase';

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
  constructor(private readonly task: Task | null) {}
  readonly updated: Task[] = [];

  async save(task: Task): Promise<Task> { return task; }
  async findById(id: string): Promise<Task | null> {
    return this.task?.id === id ? this.task : null;
  }
  async findByProjectId(projectId: string, request: PageRequest): Promise<Page<Task>> {
    const items = this.task?.projectId === projectId ? [this.task] : [];
    return {
      items: items.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: items.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async update(task: Task): Promise<Task> { this.updated.push(task); return task; }
  async delete(): Promise<void> {}
}

const createProject = () => Project.create({ name: 'Platform', ownerId: 'owner-1' });
const createTask = (projectId: string) =>
  Task.create({
    projectId,
    title: 'Original',
    description: 'Existing details',
    dueDate: new Date('2024-01-01T00:00:00Z'),
  });

describe('UpdateTaskDetailsUseCase', () => {
  it('updates details and returns the response DTO', async () => {
    const project = createProject();
    const task = createTask(project.id);
    const repository = new TaskRepositoryFake(task);
    const dueDate = new Date('2024-02-01T00:00:00Z');

    const result = await new UpdateTaskDetailsUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
    ).execute({
      taskId: task.id,
      actorId: 'owner-1',
      title: 'Updated',
      description: 'New details',
      dueDate,
    });

    expect(repository.updated).toHaveLength(1);
    expect(result).toMatchObject({
      id: task.id,
      title: 'Updated',
      description: 'New details',
      dueDate,
    });
  });

  it('leaves omitted fields unchanged', async () => {
    const project = createProject();
    const task = createTask(project.id);
    const repository = new TaskRepositoryFake(task);
    const result = await new UpdateTaskDetailsUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
    ).execute({
      taskId: task.id,
      actorId: 'owner-1',
      title: 'Updated',
    });

    expect(result.title).toBe('Updated');
    expect(result.description).toBe('Existing details');
    expect(result.dueDate).toEqual(new Date('2024-01-01T00:00:00Z'));
  });

  it('throws NotFoundException for an unknown task', async () => {
    const repository = new TaskRepositoryFake(null);
    await expect(
      new UpdateTaskDetailsUseCase(
        repository, new TaskAccess(new ProjectRepositoryFake(null), repository),
      ).execute({
        taskId: 'missing',
        actorId: 'owner-1',
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ValidationException without updating for an invalid title', async () => {
    const project = createProject();
    const task = createTask(project.id);
    const repository = new TaskRepositoryFake(task);

    await expect(
      new UpdateTaskDetailsUseCase(
        repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
      ).execute({ taskId: task.id, actorId: 'owner-1', title: ' ' }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(repository.updated).toHaveLength(0);
  });

  it('hides another owner’s task without updating it', async () => {
    const project = createProject();
    const task = createTask(project.id);
    const repository = new TaskRepositoryFake(task);

    await expect(new UpdateTaskDetailsUseCase(
      repository, new TaskAccess(new ProjectRepositoryFake(project), repository),
    ).execute({ taskId: task.id, actorId: 'owner-2', title: 'Changed' }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(task.title).toBe('Original');
    expect(repository.updated).toHaveLength(0);
  });
});
