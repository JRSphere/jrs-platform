import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { TaskCompletedEvent } from '../../domain/events/TaskCompletedEvent';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { IEventPublisher } from '../ports/IEventPublisher';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';
import { TaskAccess } from '../TaskAccess';
import { UpdateTaskStatusUseCase } from './UpdateTaskStatusUseCase';

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

class EventPublisherFake implements IEventPublisher {
  readonly published: object[] = [];
  async publish(event: object): Promise<void> { this.published.push(event); }
}

const makeTask = (projectId: string) => Task.create({ projectId, title: 'Review' });

describe('UpdateTaskStatusUseCase', () => {
  it('updates status and returns the response DTO', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = makeTask(project.id);
    const tasks = new TaskRepositoryFake(task);
    const access = new TaskAccess(new ProjectRepositoryFake(project), tasks);
    const result = await new UpdateTaskStatusUseCase(tasks, new EventPublisherFake(), access).execute({
      taskId: task.id,
      actorId: 'owner-1',
      status: TaskStatus.IN_PROGRESS,
    });

    expect(tasks.updated).toHaveLength(1);
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    expect(result.id).toBe(task.id);
  });

  it('publishes one completion event when moved to DONE', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = Task.restore({
      id: 'task-1',
      projectId: project.id,
      title: 'Review',
      description: null,
      assigneeId: null,
      status: TaskStatus.IN_PROGRESS,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const events = new EventPublisherFake();
    const tasks = new TaskRepositoryFake(task);
    await new UpdateTaskStatusUseCase(
      tasks, events, new TaskAccess(new ProjectRepositoryFake(project), tasks),
    ).execute({
      taskId: task.id,
      actorId: 'owner-1',
      status: TaskStatus.DONE,
    });

    expect(events.published).toHaveLength(1);
    expect(events.published[0]).toBeInstanceOf(TaskCompletedEvent);
  });

  it('does not publish a completion event when moved to IN_PROGRESS', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = makeTask(project.id);
    const events = new EventPublisherFake();
    const tasks = new TaskRepositoryFake(task);
    await new UpdateTaskStatusUseCase(
      tasks, events, new TaskAccess(new ProjectRepositoryFake(project), tasks),
    ).execute({
      taskId: task.id,
      actorId: 'owner-1',
      status: TaskStatus.IN_PROGRESS,
    });
    expect(events.published).toHaveLength(0);
  });

  it('rejects TODO to DONE without updating or publishing', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = makeTask(project.id);
    const tasks = new TaskRepositoryFake(task);
    const events = new EventPublisherFake();
    const access = new TaskAccess(new ProjectRepositoryFake(project), tasks);

    await expect(
      new UpdateTaskStatusUseCase(tasks, events, access).execute({
        taskId: task.id,
        actorId: 'owner-1',
        status: TaskStatus.DONE,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(tasks.updated).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });

  it('throws NotFoundException for an unknown task', async () => {
    const tasks = new TaskRepositoryFake(null);
    await expect(
      new UpdateTaskStatusUseCase(
        tasks, new EventPublisherFake(), new TaskAccess(new ProjectRepositoryFake(null), tasks),
      ).execute({
        taskId: 'missing',
        actorId: 'owner-1',
        status: TaskStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides another owner’s task without updating or publishing', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const task = makeTask(project.id);
    const tasks = new TaskRepositoryFake(task);
    const events = new EventPublisherFake();

    await expect(new UpdateTaskStatusUseCase(
      tasks, events, new TaskAccess(new ProjectRepositoryFake(project), tasks),
    ).execute({ taskId: task.id, actorId: 'owner-2', status: TaskStatus.IN_PROGRESS }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(task.status).toBe(TaskStatus.TODO);
    expect(tasks.updated).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });
});
