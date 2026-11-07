import { describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Task } from '../../domain/entities/Task';
import { ITaskRepository } from '../ports/ITaskRepository';
import { UpdateTaskDetailsUseCase } from './UpdateTaskDetailsUseCase';

class TaskRepositoryFake implements ITaskRepository {
  constructor(private readonly task: Task | null) {}
  readonly updated: Task[] = [];

  async save(task: Task): Promise<Task> { return task; }
  async findById(id: string): Promise<Task | null> {
    return this.task?.id === id ? this.task : null;
  }
  async findByProjectId(): Promise<Task[]> { return this.task ? [this.task] : []; }
  async update(task: Task): Promise<Task> { this.updated.push(task); return task; }
  async delete(): Promise<void> {}
}

const createTask = () =>
  Task.create({
    projectId: 'project-1',
    title: 'Original',
    description: 'Existing details',
    dueDate: new Date('2024-01-01T00:00:00Z'),
  });

describe('UpdateTaskDetailsUseCase', () => {
  it('updates details and returns the response DTO', async () => {
    const task = createTask();
    const repository = new TaskRepositoryFake(task);
    const dueDate = new Date('2024-02-01T00:00:00Z');

    const result = await new UpdateTaskDetailsUseCase(repository).execute({
      taskId: task.id,
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
    const task = createTask();
    const result = await new UpdateTaskDetailsUseCase(new TaskRepositoryFake(task)).execute({
      taskId: task.id,
      title: 'Updated',
    });

    expect(result.title).toBe('Updated');
    expect(result.description).toBe('Existing details');
    expect(result.dueDate).toEqual(new Date('2024-01-01T00:00:00Z'));
  });

  it('throws NotFoundException for an unknown task', async () => {
    await expect(
      new UpdateTaskDetailsUseCase(new TaskRepositoryFake(null)).execute({
        taskId: 'missing',
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ValidationException without updating for an invalid title', async () => {
    const task = createTask();
    const repository = new TaskRepositoryFake(task);

    await expect(
      new UpdateTaskDetailsUseCase(repository).execute({ taskId: task.id, title: ' ' }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(repository.updated).toHaveLength(0);
  });
});
