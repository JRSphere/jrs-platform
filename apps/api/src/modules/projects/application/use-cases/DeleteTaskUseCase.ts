import { ITaskRepository } from '../ports/ITaskRepository';
import { TaskAccess } from '../TaskAccess';

export class DeleteTaskUseCase {
  constructor(
    private readonly tasks: ITaskRepository,
    private readonly access: TaskAccess,
  ) {}

  async execute(taskId: string, actorId: string): Promise<void> {
    await this.access.loadOwnedTask(taskId, actorId);
    await this.tasks.delete(taskId);
  }
}
