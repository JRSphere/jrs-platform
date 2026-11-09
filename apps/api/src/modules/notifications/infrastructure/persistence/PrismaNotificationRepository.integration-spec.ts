import { randomUUID } from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { PrismaNotificationRepository } from './PrismaNotificationRepository';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.split('/').pop()?.endsWith('_test')) {
  throw new Error('Integration tests require a DATABASE_URL with a database name ending in _test');
}

let prisma: PrismaService;
let repository: PrismaNotificationRepository;
const recipientId = '00000000-0000-4000-8000-000000000001';

beforeAll(async () => {
  prisma = new PrismaService();
  await prisma.onModuleInit();
  repository = new PrismaNotificationRepository(prisma);
});
afterAll(async () => prisma.onModuleDestroy());
beforeEach(async () => {
  await prisma.notification.deleteMany();
});

const createNotification = (
  recipient = recipientId,
  message = 'Task assigned',
  createdAt = new Date('2024-01-01T00:00:00Z'),
) => Notification.restore({
  id: randomUUID(),
  recipientId: recipient,
  type: NotificationType.TASK_ASSIGNED,
  message,
  referenceId: null,
  readAt: null,
  createdAt,
});

describe('PrismaNotificationRepository integration', () => {
  it('saves and finds every notification field with null reference and read timestamps', async () => {
    const notification = createNotification();
    await repository.save(notification);
    expect(await repository.findById(notification.id)).toEqual(notification);
  });

  it('round-trips the read timestamp', async () => {
    const notification = Notification.restore({
      ...createNotification(),
      readAt: new Date('2024-02-01T12:30:00Z'),
    });
    await repository.save(notification);
    expect(await repository.findById(notification.id)).toEqual(notification);
  });

  it('returns null for an unknown id', async () => {
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('returns newest notifications only for the requested recipient', async () => {
    const older = createNotification(recipientId, 'Older', new Date('2024-01-01T00:00:00Z'));
    const newer = createNotification(recipientId, 'Newer', new Date('2024-01-02T00:00:00Z'));
    const other = createNotification('00000000-0000-4000-8000-000000000002', 'Other');
    await repository.save(older);
    await repository.save(other);
    await repository.save(newer);

    const page = await repository.findByRecipientId(recipientId, { page: 1, limit: 20 }, false);
    expect(page.items.map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(page.total).toBe(2);
  });

  it('excludes read notifications when unreadOnly is true', async () => {
    const unread = createNotification();
    const read = Notification.restore({ ...createNotification(), readAt: new Date() });
    await repository.save(unread);
    await repository.save(read);

    const page = await repository.findByRecipientId(recipientId, { page: 1, limit: 20 }, true);
    expect(page.items.map((item) => item.id)).toEqual([unread.id]);
    expect(page.total).toBe(1);
  });

  it('paginates five notifications and reports the full total on every page', async () => {
    const notifications = await Promise.all(
      Array.from({ length: 5 }, (_, index) => repository.save(createNotification(
        recipientId,
        `Notification ${index + 1}`,
        new Date(Date.UTC(2025, 0, 1, 0, 0, index)),
      ))),
    );
    const pageOne = await repository.findByRecipientId(recipientId, { page: 1, limit: 2 }, false);
    const pageThree = await repository.findByRecipientId(recipientId, { page: 3, limit: 2 }, false);
    const pageFour = await repository.findByRecipientId(recipientId, { page: 4, limit: 2 }, false);

    expect(pageOne.items.map((item) => item.id))
      .toEqual([notifications[4].id, notifications[3].id]);
    expect(pageThree.items.map((item) => item.id)).toEqual([notifications[0].id]);
    expect(pageFour.items).toEqual([]);
    expect([pageOne.total, pageThree.total, pageFour.total]).toEqual([5, 5, 5]);
  });

  it('counts only the recipient’s unread notifications', async () => {
    await repository.save(createNotification());
    await repository.save(Notification.restore({ ...createNotification(), readAt: new Date() }));
    await repository.save(createNotification('00000000-0000-4000-8000-000000000002'));

    expect(await repository.countUnread(recipientId)).toBe(1);
  });

  it('persists readAt when updating a notification', async () => {
    const notification = await repository.save(createNotification());
    notification.markAsRead();

    expect((await repository.update(notification)).readAt).toEqual(notification.readAt);
    expect((await repository.findById(notification.id))?.readAt).toEqual(notification.readAt);
  });

  it('throws NotFoundException when updating a missing notification', async () => {
    await expect(repository.update(createNotification())).rejects.toBeInstanceOf(NotFoundException);
  });
});
