import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { ITaskRepository } from '../ports/ITaskRepository';

export class DeleteTaskUseCase {
  constructor(private readonly tasks: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.tasks.delete(taskId);
  }
}
