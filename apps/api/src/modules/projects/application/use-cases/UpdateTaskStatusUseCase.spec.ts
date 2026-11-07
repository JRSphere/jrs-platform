import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { TaskCompletedEvent } from '../../domain/events/TaskCompletedEvent';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { IEventPublisher } from '../ports/IEventPublisher';
import { ITaskRepository } from '../ports/ITaskRepository';
import { UpdateTaskStatusUseCase } from './UpdateTaskStatusUseCase';

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

const makeTask = () => Task.create({ projectId: 'project-1', title: 'Review' });

describe('UpdateTaskStatusUseCase', () => {
  it('updates status and returns the response DTO', async () => {
    const task = makeTask();
    const tasks = new TaskRepositoryFake(task);
    const result = await new UpdateTaskStatusUseCase(tasks, new EventPublisherFake()).execute({
      taskId: task.id,
      status: TaskStatus.IN_PROGRESS,
    });

    expect(tasks.updated).toHaveLength(1);
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    expect(result.id).toBe(task.id);
  });

  it('publishes one completion event when moved to DONE', async () => {
    const task = Task.restore({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Review',
      description: null,
      assigneeId: null,
      status: TaskStatus.IN_PROGRESS,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const events = new EventPublisherFake();
    await new UpdateTaskStatusUseCase(new TaskRepositoryFake(task), events).execute({
      taskId: task.id,
      status: TaskStatus.DONE,
    });

    expect(events.published).toHaveLength(1);
    expect(events.published[0]).toBeInstanceOf(TaskCompletedEvent);
  });

  it('does not publish a completion event when moved to IN_PROGRESS', async () => {
    const task = makeTask();
    const events = new EventPublisherFake();
    await new UpdateTaskStatusUseCase(new TaskRepositoryFake(task), events).execute({
      taskId: task.id,
      status: TaskStatus.IN_PROGRESS,
    });
    expect(events.published).toHaveLength(0);
  });

  it('rejects TODO to DONE without updating or publishing', async () => {
    const task = makeTask();
    const tasks = new TaskRepositoryFake(task);
    const events = new EventPublisherFake();

    await expect(
      new UpdateTaskStatusUseCase(tasks, events).execute({
        taskId: task.id,
        status: TaskStatus.DONE,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(tasks.updated).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });

  it('throws NotFoundException for an unknown task', async () => {
    await expect(
      new UpdateTaskStatusUseCase(new TaskRepositoryFake(null), new EventPublisherFake()).execute({
        taskId: 'missing',
        status: TaskStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
