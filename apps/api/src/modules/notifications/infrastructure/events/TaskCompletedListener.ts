import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { NotificationType } from '../../domain/value-objects/NotificationType';

interface TaskCompletedPayload {
  taskId: string;
  assigneeId: string | null;
  actorId?: string;
}

@Injectable()
export class TaskCompletedListener {
  private readonly logger = new Logger(TaskCompletedListener.name);

  constructor(
    @Inject(CreateNotificationUseCase)
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  @OnEvent('TaskCompletedEvent')
  async handle(payload: Partial<TaskCompletedPayload> | null | undefined): Promise<void> {
    try {
      if (typeof payload?.taskId !== 'string' || payload.taskId.trim().length === 0) {
        this.logger.warn(
          `Ignoring TaskCompletedEvent with invalid taskId=${String(payload?.taskId)}`,
        );
        return;
      }
      if (payload.assigneeId == null) {
        return;
      }
      if (typeof payload.actorId === 'string' && payload.actorId === payload.assigneeId) {
        return;
      }

      await this.createNotification.execute({
        recipientId: payload.assigneeId,
        type: NotificationType.TASK_COMPLETED,
        message: 'A task assigned to you was marked as done.',
        referenceId: payload.taskId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const name = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Failed to create task completion notification: ${message} (${name})`);
    }
  }
}
