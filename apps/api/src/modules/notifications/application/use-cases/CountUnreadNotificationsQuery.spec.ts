import { describe, expect, it } from 'vitest';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { Page, PageRequest } from '../dto/Pagination';
import { INotificationRepository } from '../ports/INotificationRepository';
import { CountUnreadNotificationsQuery } from './CountUnreadNotificationsQuery';

class NotificationRepositoryFake implements INotificationRepository {
  constructor(private readonly notifications: Notification[]) {}

  async save(notification: Notification): Promise<Notification> { return notification; }
  async findById(id: string): Promise<Notification | null> { return this.notifications.find((item) => item.id === id) ?? null; }
  async findByRecipientId(_recipientId: string, request: PageRequest): Promise<Page<Notification>> { return { items: [], total: 0, page: request.page, limit: request.limit }; }
  async countUnread(recipientId: string): Promise<number> { return this.notifications.filter((item) => item.isForRecipient(recipientId) && !item.isRead()).length; }
  async update(notification: Notification): Promise<Notification> { return notification; }
}

const notification = (recipientId: string, message: string) => Notification.create({
  recipientId,
  type: NotificationType.TASK_ASSIGNED,
  message,
});

describe('CountUnreadNotificationsQuery', () => {
  it('counts only the actor’s unread notifications', async () => {
    const unread = notification('recipient-1', 'Unread');
    const read = notification('recipient-1', 'Read');
    read.markAsRead();
    const other = notification('recipient-2', 'Other');
    const result = await new CountUnreadNotificationsQuery(
      new NotificationRepositoryFake([unread, read, other]),
    ).execute('recipient-1');

    expect(result).toBe(1);
  });
});
