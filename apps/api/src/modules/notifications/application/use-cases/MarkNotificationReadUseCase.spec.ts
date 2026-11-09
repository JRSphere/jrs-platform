import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { Page, PageRequest } from '../dto/Pagination';
import { INotificationRepository } from '../ports/INotificationRepository';
import { MarkNotificationReadUseCase } from './MarkNotificationReadUseCase';

class NotificationRepositoryFake implements INotificationRepository {
  readonly updated: Notification[] = [];

  constructor(private readonly notifications: Notification[]) {}

  async save(notification: Notification): Promise<Notification> { return notification; }
  async findById(id: string): Promise<Notification | null> { return this.notifications.find((item) => item.id === id) ?? null; }
  async findByRecipientId(_recipientId: string, request: PageRequest): Promise<Page<Notification>> { return { items: [], total: 0, page: request.page, limit: request.limit }; }
  async countUnread(): Promise<number> { return 0; }
  async update(notification: Notification): Promise<Notification> {
    this.updated.push(notification);
    return notification;
  }
}

const createNotification = (recipientId = 'recipient-1') => Notification.create({
  recipientId,
  type: NotificationType.TASK_ASSIGNED,
  message: 'Task assigned',
});

describe('MarkNotificationReadUseCase', () => {
  afterEach(() => vi.useRealTimers());

  it('marks a recipient notification as read and persists it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    const notification = createNotification();
    const repository = new NotificationRepositoryFake([notification]);
    const result = await new MarkNotificationReadUseCase(repository)
      .execute(notification.id, 'recipient-1');

    expect(result.readAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    expect(repository.updated).toEqual([notification]);
  });

  it('keeps the first readAt when marking an already-read notification', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    const notification = createNotification();
    notification.markAsRead();
    vi.setSystemTime(new Date('2024-01-03T00:00:00Z'));
    const repository = new NotificationRepositoryFake([notification]);

    await new MarkNotificationReadUseCase(repository).execute(notification.id, 'recipient-1');

    expect(notification.readAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    expect(repository.updated).toEqual([notification]);
  });

  it('hides another recipient’s notification and does not update it', async () => {
    const notification = createNotification();
    const repository = new NotificationRepositoryFake([notification]);

    await expect(new MarkNotificationReadUseCase(repository).execute(notification.id, 'other'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(notification.readAt).toBeNull();
    expect(repository.updated).toEqual([]);
  });

  it('throws NotFoundException for an unknown id without updating', async () => {
    const repository = new NotificationRepositoryFake([]);

    await expect(new MarkNotificationReadUseCase(repository).execute('missing', 'recipient-1'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updated).toEqual([]);
  });
});
