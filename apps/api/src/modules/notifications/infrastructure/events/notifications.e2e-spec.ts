import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { configureApp } from '../../../../infrastructure/http/configureApp';
import { setupOpenApi } from '../../../../infrastructure/http/setupOpenApi';
import { AppModule } from '../../../../app.module';

const databaseUrl = process.env.DATABASE_URL;
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.split('/').filter(Boolean).pop()
  : undefined;
if (!databaseName?.endsWith('_test')) {
  throw new Error('E2E tests require a DATABASE_URL with a database name ending in _test');
}

const ownerId = randomUUID();
const assigneeId = randomUUID();
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

function request(server: ReturnType<INestApplication['getHttpServer']>, userId = ownerId) {
  return {
    post: (path: string) => withTestUser(supertest(server).post(path), userId),
    patch: (path: string) => withTestUser(supertest(server).patch(path), userId),
  };
}

async function insertProject() {
  const now = new Date();
  return prisma.project.create({
    data: { id: randomUUID(), name: 'Platform', ownerId, createdAt: now, updatedAt: now },
  });
}

async function insertTask(projectId: string) {
  const now = new Date();
  return prisma.task.create({
    data: {
      id: randomUUID(),
      projectId,
      title: 'Review',
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function pollUntil<T>(condition: () => Promise<T | null>): Promise<T> {
  const deadline = Date.now() + 2000;
  while (Date.now() <= deadline) {
    const result = await condition();
    if (result !== null) {
      return result;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for an asynchronous notification');
}

async function waitForSingleNotification(recipientId: string, taskId: string): Promise<void> {
  const notification = await pollUntil(() => prisma.notification.findFirst({
    where: { recipientId, referenceId: taskId },
  }));
  expect(notification).toMatchObject({
    recipientId,
    type: 'TASK_ASSIGNED',
    referenceId: taskId,
    readAt: null,
  });
  expect(await prisma.notification.count({ where: { recipientId } })).toBe(1);
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

describe('Task assignment notifications E2E', () => {
  it('creates a notification when a task is assigned through the API', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/assignee`)
      .send({ assigneeId })
      .expect(200);
    await waitForSingleNotification(assigneeId, task.id);
  });

  it('creates a notification when a task is created with an assignee', async () => {
    const project = await insertProject();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/tasks`)
      .send({ title: 'Review', assigneeId })
      .expect(201);
    await waitForSingleNotification(assigneeId, response.body.id);
  });

  it('does not create a notification when a task is created without an assignee', async () => {
    const project = await insertProject();

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/tasks`)
      .send({ title: 'Review' })
      .expect(201);

    expect(await prisma.notification.count()).toBe(0);
  });

  it('does not create a notification when task status changes', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(await prisma.notification.count()).toBe(0);
  });

  it('does not create a notification for a failed assignment', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/assignee`)
      .send({ assigneeId: 'not-a-uuid' })
      .expect(400);

    expect(await prisma.notification.count()).toBe(0);
  });
});
