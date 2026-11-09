import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';
import { configureApp } from '../../../../infrastructure/http/configureApp';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { setupOpenApi } from '../../../../infrastructure/http/setupOpenApi';
import { NotificationType } from '../../domain/value-objects/NotificationType';

const databaseUrl = process.env.DATABASE_URL;
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.split('/').filter(Boolean).pop()
  : undefined;
if (!databaseName?.endsWith('_test')) {
  throw new Error('E2E tests require a DATABASE_URL with a database name ending in _test');
}

const recipientId = randomUUID();
const otherRecipientId = randomUUID();
let app: INestApplication;
let prisma: PrismaService;

interface TestRequest {
  header(name: string): string | undefined;
  user?: { id: string };
}

function withTestUser<T extends { set(field: string, value: string): T }>(
  test: T,
  userId: string,
): T {
  return test.set('x-test-user', userId);
}

function request(server: ReturnType<INestApplication['getHttpServer']>, userId = recipientId) {
  return {
    get: (path: string) => withTestUser(supertest(server).get(path), userId),
    patch: (path: string) => withTestUser(supertest(server).patch(path), userId),
  };
}

async function insertNotification(
  userId = recipientId,
  createdAt = new Date(),
  readAt: Date | null = null,
) {
  return prisma.notification.create({
    data: {
      id: randomUUID(),
      recipientId: userId,
      type: NotificationType.TASK_ASSIGNED,
      message: 'You have been assigned a task.',
      referenceId: randomUUID(),
      readAt,
      createdAt,
    },
  });
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  setupOpenApi(app);
  app.use((req: TestRequest, _res: unknown, next: () => void) => {
    const id = req.header('x-test-user');
    if (id) {
      (req as typeof req & { user?: { id: string } }).user = { id };
    }
    next();
  });
  await app.init();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
});

describe('Notifications HTTP API', () => {
  it.each([
    ['GET', '/api/v1/notifications'],
    ['GET', '/api/v1/notifications/unread-count'],
    ['PATCH', `/api/v1/notifications/${randomUUID()}/read`],
  ] as const)('rejects unauthenticated %s %s', async (method, path) => {
    const client = supertest(app.getHttpServer());
    const response = method === 'GET'
      ? client.get(path)
      : client.patch(path);
    await response.expect(401);
  });

  it('lists only the caller’s notifications newest first with their total', async () => {
    const older = await insertNotification(recipientId, new Date('2024-01-01T00:00:00Z'));
    const newest = await insertNotification(recipientId, new Date('2024-01-03T00:00:00Z'));
    await insertNotification(otherRecipientId, new Date('2024-01-04T00:00:00Z'));

    const response = await request(app.getHttpServer()).get('/api/v1/notifications').expect(200);

    expect(response.body).toMatchObject({
      total: 2,
      page: 1,
      limit: 20,
      items: [{ id: newest.id }, { id: older.id }],
    });
  });

  it('excludes read notifications when unreadOnly is true', async () => {
    const unread = await insertNotification(recipientId, new Date(), null);
    await insertNotification(recipientId, new Date(), new Date('2024-01-02T00:00:00Z'));

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query({ unreadOnly: 'true' })
      .expect(200);

    expect(response.body).toMatchObject({ total: 1, items: [{ id: unread.id, readAt: null }] });
  });

  it('paginates notifications while reporting the full total', async () => {
    const notifications = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        insertNotification(recipientId, new Date(Date.UTC(2025, 0, 1, 0, 0, index))),
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query({ limit: 2 })
      .expect(200);

    expect(response.body).toMatchObject({
      total: 5,
      page: 1,
      limit: 2,
      items: [{ id: notifications[4].id }, { id: notifications[3].id }],
    });
  });

  it('returns an empty page past the end with the actual total', async () => {
    await Promise.all(Array.from({ length: 5 }, (_, index) =>
      insertNotification(recipientId, new Date(Date.UTC(2025, 0, 1, 0, 0, index))),
    ));

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query({ page: 4, limit: 2 })
      .expect(200);

    expect(response.body).toMatchObject({ items: [], total: 5, page: 4, limit: 2 });
  });

  it.each([
    ['limit zero', { limit: 0 }],
    ['limit above 100', { limit: 101 }],
    ['page zero', { page: 0 }],
    ['invalid unreadOnly', { unreadOnly: 'maybe' }],
    ['unknown query parameter', { unknown: 'value' }],
  ])('rejects %s', async (_case, query) => {
    await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query(query)
      .expect(400);
  });

  it('counts only the caller’s unread notifications', async () => {
    await insertNotification(recipientId);
    await insertNotification(recipientId, new Date(), new Date('2024-01-02T00:00:00Z'));
    await insertNotification(otherRecipientId);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .expect(200);

    expect(response.body).toEqual({ count: 1 });
  });

  it('marks the caller’s notification as read and persists it', async () => {
    const notification = await insertNotification();

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notification.id}/read`)
      .expect(200);

    expect(response.body.readAt).toEqual(expect.any(String));
    expect((await prisma.notification.findUnique({ where: { id: notification.id } }))?.readAt)
      .toEqual(new Date(response.body.readAt as string));
  });

  it('keeps the first readAt when marking a notification twice', async () => {
    const notification = await insertNotification();
    const first = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notification.id}/read`)
      .expect(200);

    const second = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notification.id}/read`)
      .expect(200);

    expect(second.body.readAt).toBe(first.body.readAt);
  });

  it('hides another user’s notification and leaves it unread', async () => {
    const notification = await insertNotification(otherRecipientId);

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notification.id}/read`)
      .expect(404);

    expect((await prisma.notification.findUnique({ where: { id: notification.id } }))?.readAt)
      .toBeNull();
  });

  it('returns 404 for an unknown valid UUID', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${randomUUID()}/read`)
      .expect(404);
  });

  it('rejects a non-UUID notification id', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/notifications/not-a-uuid/read')
      .expect(400);
  });

  it('routes unread-count before a notification id route', async () => {
    await insertNotification();

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .expect(200);

    expect(response.body).toEqual({ count: 1 });
  });
});
