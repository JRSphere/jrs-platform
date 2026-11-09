import { describe, expect, it, vi } from 'vitest';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { Page, PageRequest } from '../dto/Pagination';
import { INotificationRepository } from '../ports/INotificationRepository';
import { ListNotificationsQuery } from './ListNotificationsQuery';

class NotificationRepositoryFake implements INotificationRepository {
  constructor(private readonly notifications: Notification[]) {}

  async save(notification: Notification): Promise<Notification> { return notification; }
  async findById(id: string): Promise<Notification | null> { return this.notifications.find((item) => item.id === id) ?? null; }
  async findByRecipientId(
    recipientId: string,
    request: PageRequest,
    unreadOnly: boolean,
  ): Promise<Page<Notification>> {
    const matching = this.notifications
      .filter((item) => item.isForRecipient(recipientId) && (!unreadOnly || !item.isRead()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      items: matching.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: matching.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async countUnread(recipientId: string): Promise<number> { return this.notifications.filter((item) => item.isForRecipient(recipientId) && !item.isRead()).length; }
  async update(notification: Notification): Promise<Notification> { return notification; }
}

const createAt = (recipientId: string, message: string, time: string) => {
  vi.setSystemTime(new Date(time));
  return Notification.create({ recipientId, type: NotificationType.TASK_ASSIGNED, message });
};

describe('ListNotificationsQuery', () => {
  it('returns the actor’s notifications newest first with the requested page and total', async () => {
    vi.useFakeTimers();
    try {
      const older = createAt('recipient-1', 'Older', '2024-01-01T00:00:00Z');
      const middle = createAt('recipient-1', 'Middle', '2024-01-02T00:00:00Z');
      const newest = createAt('recipient-1', 'Newest', '2024-01-03T00:00:00Z');
      const other = createAt('recipient-2', 'Other', '2024-01-04T00:00:00Z');
      const result = await new ListNotificationsQuery(new NotificationRepositoryFake(
        [older, other, middle, newest],
      )).execute('recipient-1', { page: 1, limit: 2 }, false);

      expect(result.items.map((item) => item.id)).toEqual([newest.id, middle.id]);
      expect(result).toMatchObject({ total: 3, page: 1, limit: 2 });
      expect(result.items.every((item) => item.recipientId === 'recipient-1')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('excludes read notifications when unreadOnly is true', async () => {
    const unread = Notification.create({
      recipientId: 'recipient-1', type: NotificationType.TASK_ASSIGNED, message: 'Unread',
    });
    const read = Notification.create({
      recipientId: 'recipient-1', type: NotificationType.TASK_ASSIGNED, message: 'Read',
    });
    read.markAsRead();
    const result = await new ListNotificationsQuery(
      new NotificationRepositoryFake([unread, read]),
    ).execute('recipient-1', { page: 1, limit: 10 }, true);

    expect(result.items.map((item) => item.id)).toEqual([unread.id]);
    expect(result.total).toBe(1);
  });

  it('returns no items past the end while preserving the total', async () => {
    const notifications = [1, 2, 3].map((number) => Notification.create({
      recipientId: 'recipient-1',
      type: NotificationType.TASK_ASSIGNED,
      message: `Notification ${number}`,
    }));
    const result = await new ListNotificationsQuery(new NotificationRepositoryFake(notifications))
      .execute('recipient-1', { page: 3, limit: 2 }, false);

    expect(result).toEqual({ items: [], total: 3, page: 3, limit: 2 });
  });
});
