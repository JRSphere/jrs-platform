import { describe, expect, it } from 'vitest';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { CreateNotificationDto } from '../dto/CreateNotificationDto';
import { Page, PageRequest } from '../dto/Pagination';
import { INotificationRepository } from '../ports/INotificationRepository';
import { CreateNotificationUseCase } from './CreateNotificationUseCase';

class NotificationRepositoryFake implements INotificationRepository {
  readonly notifications: Notification[] = [];

  async save(notification: Notification): Promise<Notification> { this.notifications.push(notification); return notification; }
  async findById(id: string): Promise<Notification | null> { return this.notifications.find((item) => item.id === id) ?? null; }
  async findByRecipientId(_recipientId: string, request: PageRequest): Promise<Page<Notification>> { return { items: [], total: 0, page: request.page, limit: request.limit }; }
  async countUnread(): Promise<number> { return 0; }
  async update(notification: Notification): Promise<Notification> { return notification; }
}

const input: CreateNotificationDto = {
  recipientId: 'recipient-1',
  type: NotificationType.TASK_ASSIGNED,
  message: 'Task assigned',
  referenceId: 'task-1',
};

describe('CreateNotificationUseCase', () => {
  it('saves the notification and returns its DTO', async () => {
    const repository = new NotificationRepositoryFake();
    const result = await new CreateNotificationUseCase(repository).execute(input);

    expect(repository.notifications).toHaveLength(1);
    expect(result).toEqual({
      ...repository.notifications[0],
      referenceId: 'task-1',
      readAt: null,
    });
  });

  it('rejects a blank message without saving', async () => {
    const repository = new NotificationRepositoryFake();
    await expect(new CreateNotificationUseCase(repository).execute({ ...input, message: ' ' }))
      .rejects.toBeInstanceOf(ValidationException);
    expect(repository.notifications).toHaveLength(0);
  });
});
