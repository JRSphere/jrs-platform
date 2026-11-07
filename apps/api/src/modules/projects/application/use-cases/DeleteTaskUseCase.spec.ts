import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';
import { ITaskRepository } from '../ports/ITaskRepository';
import { DeleteTaskUseCase } from './DeleteTaskUseCase';

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
    const task = Task.create({ projectId: 'project-1', title: 'Review' });
    const repository = new TaskRepositoryFake([task]);

    await new DeleteTaskUseCase(repository).execute(task.id);

    expect(repository.deleted).toEqual([task.id]);
  });

  it('throws NotFoundException and deletes nothing for an unknown task', async () => {
    const repository = new TaskRepositoryFake([]);

    await expect(new DeleteTaskUseCase(repository).execute('missing'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleted).toEqual([]);
  });

  it('throws NotFoundException when deleting the same task twice', async () => {
    const task = Task.create({ projectId: 'project-1', title: 'Review' });
    const repository = new TaskRepositoryFake([task]);
    const useCase = new DeleteTaskUseCase(repository);
    await useCase.execute(task.id);

    await expect(useCase.execute(task.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleted).toEqual([task.id]);
  });
});
