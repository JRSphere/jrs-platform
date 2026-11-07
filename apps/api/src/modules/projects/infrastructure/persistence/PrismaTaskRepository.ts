import { Injectable } from '@nestjs/common';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { Task } from '../../domain/entities/Task';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { ITaskRepository } from '../../application/ports/ITaskRepository';

@Injectable()
export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(task: Task): Promise<Task> {
    const saved = await this.prisma.task.create({
      data: {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    return task ? this.toDomain(task) : null;
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    return tasks.map((task) => this.toDomain(task));
  }

  async update(task: Task): Promise<Task> {
    try {
      const updated = await this.prisma.task.update({
        where: { id: task.id },
        data: {
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          status: task.status,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
      return this.toDomain(updated);
    } catch (error) {
      if (isMissingRecord(error)) {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.deleteMany({ where: { id } });
  }

  private toDomain(task: {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    assigneeId: string | null;
    status: string;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    const statuses: Readonly<Record<string, TaskStatus>> = {
      TODO: TaskStatus.TODO,
      IN_PROGRESS: TaskStatus.IN_PROGRESS,
      DONE: TaskStatus.DONE,
    };
    const status = statuses[task.status];
    if (!status) {
      throw new Error(`Unknown task status: ${task.status}`);
    }
    return Task.restore({ ...task, status });
  }
}

function isMissingRecord(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
}
