import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { TaskAssignedEvent } from '../../domain/events/TaskAssignedEvent';
import { IEventPublisher } from '../ports/IEventPublisher';
import { ITaskRepository } from '../ports/ITaskRepository';
import { AssignTaskUseCase } from './AssignTaskUseCase';

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

describe('AssignTaskUseCase', () => {
  it('assigns, saves, publishes the event, and returns the response DTO', async () => {
    const task = makeTask();
    const tasks = new TaskRepositoryFake(task);
    const events = new EventPublisherFake();
    const result = await new AssignTaskUseCase(tasks, events).execute({
      taskId: task.id,
      assigneeId: 'user-1',
    });

    expect(tasks.updated).toHaveLength(1);
    expect(result.assigneeId).toBe('user-1');
    expect(events.published).toHaveLength(1);
    expect(events.published[0]).toBeInstanceOf(TaskAssignedEvent);
  });

  it('rejects a blank assignee without publishing', async () => {
    const task = makeTask();
    const tasks = new TaskRepositoryFake(task);
    const events = new EventPublisherFake();

    await expect(
      new AssignTaskUseCase(tasks, events).execute({ taskId: task.id, assigneeId: '  ' }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(tasks.updated).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });

  it('throws NotFoundException for an unknown task', async () => {
    const events = new EventPublisherFake();
    await expect(
      new AssignTaskUseCase(new TaskRepositoryFake(null), events).execute({
        taskId: 'missing',
        assigneeId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(events.published).toHaveLength(0);
  });
});
