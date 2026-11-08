import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../shared-kernel/exceptions/NotFoundException';
import { Project } from '../domain/entities/Project';
import { Task } from '../domain/entities/Task';
import { Page, PageRequest } from './dto/Pagination';
import { IProjectRepository } from './ports/IProjectRepository';
import { ITaskRepository } from './ports/ITaskRepository';
import { TaskAccess } from './TaskAccess';

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
  async save(task: Task): Promise<Task> { return task; }
  async findById(id: string): Promise<Task | null> {
    return this.task?.id === id ? this.task : null;
  }
  async findByProjectId(_projectId: string, request: PageRequest): Promise<Page<Task>> {
    return { items: [], total: 0, page: request.page, limit: request.limit };
  }
  async update(task: Task): Promise<Task> { return task; }
  async delete(): Promise<void> {}
}

const makeProject = (ownerId = 'owner-1') =>
  Project.create({ name: 'Platform', ownerId });

const makeTask = (projectId: string) =>
  Task.create({ projectId, title: 'Review' });

async function expectHidden(access: TaskAccess, taskId: string, actorId: string): Promise<void> {
  const error = await access.loadOwnedTask(taskId, actorId).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(NotFoundException);
  expect(error).toMatchObject({ message: 'Task not found' });
}

describe('TaskAccess', () => {
  it('returns the task for its project owner', async () => {
    const project = makeProject();
    const task = makeTask(project.id);
    const access = new TaskAccess(new ProjectRepositoryFake(project), new TaskRepositoryFake(task));

    await expect(access.loadOwnedTask(task.id, 'owner-1')).resolves.toBe(task);
  });

  it('hides another owner’s task', async () => {
    const project = makeProject();
    const task = makeTask(project.id);
    const access = new TaskAccess(new ProjectRepositoryFake(project), new TaskRepositoryFake(task));

    await expectHidden(access, task.id, 'owner-2');
  });

  it('hides a missing task', async () => {
    const access = new TaskAccess(new ProjectRepositoryFake(null), new TaskRepositoryFake(null));

    await expectHidden(access, 'missing', 'owner-1');
  });

  it('hides a task whose project no longer exists', async () => {
    const task = makeTask('deleted-project');
    const access = new TaskAccess(new ProjectRepositoryFake(null), new TaskRepositoryFake(task));

    await expectHidden(access, task.id, 'owner-1');
  });
});
