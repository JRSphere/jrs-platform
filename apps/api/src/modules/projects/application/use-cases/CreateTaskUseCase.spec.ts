import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { TaskAssignedEvent } from '../../domain/events/TaskAssignedEvent';
import { TaskCreatedEvent } from '../../domain/events/TaskCreatedEvent';
import { IEventPublisher } from '../ports/IEventPublisher';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ITaskRepository } from '../ports/ITaskRepository';
import { CreateTaskUseCase } from './CreateTaskUseCase';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private readonly project: Project | null) {}
  async save(project: Project): Promise<Project> { return project; }
  async findById(id: string): Promise<Project | null> {
    return this.project?.id === id ? this.project : null;
  }
  async findAll(): Promise<Project[]> { return this.project ? [this.project] : []; }
  async update(project: Project): Promise<Project> { return project; }
  async delete(): Promise<void> {}
}

class TaskRepositoryFake implements ITaskRepository {
  readonly saved: Task[] = [];
  async save(task: Task): Promise<Task> { this.saved.push(task); return task; }
  async findById(): Promise<Task | null> { return null; }
  async findByProjectId(projectId: string): Promise<Task[]> {
    return this.saved.filter((task) => task.projectId === projectId);
  }
  async update(task: Task): Promise<Task> { return task; }
  async delete(): Promise<void> {}
}

class EventPublisherFake implements IEventPublisher {
  readonly published: object[] = [];
  async publish(event: object): Promise<void> { this.published.push(event); }
}

describe('CreateTaskUseCase', () => {
  it('saves the task and returns its response DTO', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const tasks = new TaskRepositoryFake();
    const events = new EventPublisherFake();
    const result = await new CreateTaskUseCase(
      new ProjectRepositoryFake(project), tasks, events,
    ).execute({ projectId: project.id, title: 'Review' });

    expect(tasks.saved).toHaveLength(1);
    expect(result.id).toBe(tasks.saved[0].id);
    expect(result.title).toBe('Review');
  });

  it('publishes one creation event when no assignee is provided', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const events = new EventPublisherFake();
    await new CreateTaskUseCase(
      new ProjectRepositoryFake(project), new TaskRepositoryFake(), events,
    ).execute({ projectId: project.id, title: 'Review' });

    expect(events.published).toHaveLength(1);
    expect(events.published[0]).toBeInstanceOf(TaskCreatedEvent);
  });

  it('publishes an assignment event only when an assignee is provided', async () => {
    const project = Project.create({ name: 'Platform', ownerId: 'owner-1' });
    const events = new EventPublisherFake();
    await new CreateTaskUseCase(
      new ProjectRepositoryFake(project), new TaskRepositoryFake(), events,
    ).execute({ projectId: project.id, title: 'Review', assigneeId: 'user-1' });

    expect(events.published).toHaveLength(2);
    expect(events.published[0]).toBeInstanceOf(TaskCreatedEvent);
    expect(events.published[1]).toBeInstanceOf(TaskAssignedEvent);
  });

  it('throws NotFoundException and performs no save or publish for an unknown project', async () => {
    const tasks = new TaskRepositoryFake();
    const events = new EventPublisherFake();

    await expect(
      new CreateTaskUseCase(
        new ProjectRepositoryFake(null), tasks, events,
      ).execute({ projectId: 'missing', title: 'Review' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tasks.saved).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });
});
