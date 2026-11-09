import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { NotificationType } from '../../domain/value-objects/NotificationType';

interface TaskAssignedPayload {
  taskId: string;
  projectId: string;
  assigneeId: string;
}

@Injectable()
export class TaskAssignedListener {
  private readonly logger = new Logger(TaskAssignedListener.name);

  constructor(
    @Inject(CreateNotificationUseCase)
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  @OnEvent('TaskAssignedEvent')
  async handle(payload: Partial<TaskAssignedPayload> | null | undefined): Promise<void> {
    try {
      if (
        typeof payload?.taskId !== 'string'
        || payload.taskId.trim().length === 0
        || typeof payload.assigneeId !== 'string'
        || payload.assigneeId.trim().length === 0
      ) {
        this.logger.warn(
          `Ignoring TaskAssignedEvent with invalid ids: taskId=${String(payload?.taskId)}, assigneeId=${String(payload?.assigneeId)}`,
        );
        return;
      }

      await this.createNotification.execute({
        recipientId: payload.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        message: 'You have been assigned a task.',
        referenceId: payload.taskId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const name = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Failed to create task assignment notification: ${message} (${name})`);
    }
  }
}
