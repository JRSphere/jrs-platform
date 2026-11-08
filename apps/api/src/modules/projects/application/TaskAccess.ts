import { NotFoundException } from '../../../shared-kernel/exceptions/NotFoundException';
import { Task } from '../domain/entities/Task';
import { IProjectRepository } from './ports/IProjectRepository';
import { ITaskRepository } from './ports/ITaskRepository';

export class TaskAccess {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly tasks: ITaskRepository,
  ) {}

  async loadOwnedTask(taskId: string, actorId: string): Promise<Task> {
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.projects.findById(task.projectId);
    if (!project || !project.isOwnedBy(actorId)) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}
