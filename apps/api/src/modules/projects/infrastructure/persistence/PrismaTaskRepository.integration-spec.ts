import { randomUUID } from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { Project } from '../../domain/entities/Project';
import { Task } from '../../domain/entities/Task';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { PrismaProjectRepository } from './PrismaProjectRepository';
import { PrismaTaskRepository } from './PrismaTaskRepository';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.split('/').pop()?.endsWith('_test')) {
  throw new Error('Integration tests require a DATABASE_URL with a database name ending in _test');
}

let prisma: PrismaService;
let projects: PrismaProjectRepository;
let repository: PrismaTaskRepository;
let project: Project;
const ownerId = '00000000-0000-4000-8000-000000000001';
const assigneeId = '00000000-0000-4000-8000-000000000002';

beforeAll(async () => {
  prisma = new PrismaService();
  await prisma.onModuleInit();
  projects = new PrismaProjectRepository(prisma);
  repository = new PrismaTaskRepository(prisma);
});
afterAll(async () => prisma.onModuleDestroy());
beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  project = await projects.save(Project.create({ name: 'Platform', ownerId }));
});

describe('PrismaTaskRepository integration', () => {
  it('round-trips optional null fields and dueDate', async () => {
    const task = Task.create({ projectId: project.id, title: 'No optional values' });
    await repository.save(task);
    expect(await repository.findById(task.id)).toEqual(task);
    const withDueDate = Task.create({
      projectId: project.id, title: 'Has due date', dueDate: new Date('2025-01-01T12:00:00Z'),
    });
    await repository.save(withDueDate);
    expect(await repository.findById(withDueDate.id)).toEqual(withDueDate);
  });

  it('round-trips status as the domain TaskStatus enum', async () => {
    const task = Task.create({ projectId: project.id, title: 'Active' });
    task.changeStatus(TaskStatus.IN_PROGRESS);
    await repository.save(task);
    expect((await repository.findById(task.id))?.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('returns only tasks for the requested project', async () => {
    const anotherProject = await projects.save(Project.create({ name: 'Other', ownerId }));
    await repository.save(Task.create({ projectId: project.id, title: 'Included' }));
    await repository.save(Task.create({ projectId: anotherProject.id, title: 'Excluded' }));
    expect((await repository.findByProjectId(project.id)).map((task) => task.title)).toEqual(['Included']);
  });

  it('persists status and assignee changes', async () => {
    const task = await repository.save(Task.create({ projectId: project.id, title: 'Update me' }));
    task.changeStatus(TaskStatus.IN_PROGRESS);
    task.assign(assigneeId);
    const updated = await repository.update(task);
    expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    expect(updated.assigneeId).toBe(assigneeId);
  });

  it('throws NotFoundException when updating a missing task', async () => {
    await expect(repository.update(Task.create({
      projectId: project.id, title: 'Missing',
    }))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a task', async () => {
    const task = await repository.save(Task.create({ projectId: project.id, title: 'Delete me' }));
    await repository.delete(task.id);
    expect(await repository.findById(task.id)).toBeNull();
  });

  it('does not throw when deleting a missing task', async () => {
    await expect(repository.delete(randomUUID())).resolves.toBeUndefined();
  });

  it('cascades project deletion to its tasks', async () => {
    await repository.save(Task.create({ projectId: project.id, title: 'Cascade me' }));
    await prisma.project.delete({ where: { id: project.id } });
    expect(await repository.findByProjectId(project.id)).toEqual([]);
  });
});
