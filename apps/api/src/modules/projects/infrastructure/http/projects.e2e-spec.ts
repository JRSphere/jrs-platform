import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { AppModule } from '../../../../app.module';
import { configureApp } from '../../../../infrastructure/http/configureApp';
import { setupOpenApi } from '../../../../infrastructure/http/setupOpenApi';

const databaseUrl = process.env.DATABASE_URL;
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.split('/').filter(Boolean).pop()
  : undefined;
if (!databaseName?.endsWith('_test')) {
  throw new Error('E2E tests require a DATABASE_URL with a database name ending in _test');
}

const ownerId = '00000000-0000-4000-8000-000000000001';
const assigneeId = '00000000-0000-4000-8000-000000000002';
let app: INestApplication;
let prisma: PrismaService;

async function insertProject(name = 'Platform') {
  const now = new Date();
  return prisma.project.create({
    data: { id: randomUUID(), name, ownerId, createdAt: now, updatedAt: now },
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

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  setupOpenApi(app);
  await app.init();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
});

describe('Projects HTTP API', () => {
  it('documents exactly the projects and tasks routes in OpenAPI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const pathMethods = Object.entries(response.body.paths).flatMap(([path, operations]) =>
      Object.keys(operations as Record<string, unknown>).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(pathMethods.sort()).toEqual([
      'GET /api/v1/projects/{projectId}/tasks',
      'PATCH /api/v1/tasks/{taskId}',
      'PATCH /api/v1/tasks/{taskId}/assignee',
      'PATCH /api/v1/tasks/{taskId}/status',
      'POST /api/v1/projects',
      'POST /api/v1/projects/{projectId}/tasks',
    ]);
  });

  it('creates a project', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Platform', ownerId })
      .expect(201);
    expect(response.body).toMatchObject({ id: expect.any(String), name: 'Platform' });
  });

  it('rejects an empty project name', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: '', ownerId })
      .expect(400);
  });

  it('rejects unknown project fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Platform', ownerId, unexpected: true })
      .expect(400);
  });

  it('rejects a non-UUID project owner', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Platform', ownerId: 'not-a-uuid' })
      .expect(400);
  });

  it('creates a task in a project', async () => {
    const project = await insertProject();
    const response = await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/tasks`)
      .send({ title: 'Review' })
      .expect(201);
    expect(response.body.status).toBe('TODO');
  });

  it('rejects task titles longer than 255 characters', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/tasks`)
      .send({ title: 't'.repeat(256) })
      .expect(400);
  });

  it('returns 404 when creating a task for an unknown project', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${randomUUID()}/tasks`)
      .send({ title: 'Review' })
      .expect(404);
  });

  it('rejects a non-UUID project path parameter', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects/not-a-uuid/tasks')
      .send({ title: 'Review' })
      .expect(400);
  });

  it('returns only tasks belonging to the requested project', async () => {
    const project = await insertProject();
    const otherProject = await insertProject('Other');
    await insertTask(project.id);
    await insertTask(otherProject.id);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].projectId).toBe(project.id);
  });

  it('returns 404 when listing tasks for an unknown project', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${randomUUID()}/tasks`)
      .expect(404);
  });

  it('updates task status from TODO through IN_PROGRESS to DONE', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('IN_PROGRESS'));
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'DONE' })
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('DONE'));
  });

  it('rejects a direct TODO to DONE transition', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'DONE' })
      .expect(400);
  });

  it('returns 404 when updating an unknown task status', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${randomUUID()}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(404);
  });

  it('assigns a task', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/assignee`)
      .send({ assigneeId })
      .expect(200);
    expect(response.body.assigneeId).toBe(assigneeId);
  });

  it('rejects a non-UUID task assignee', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/assignee`)
      .send({ assigneeId: 'not-a-uuid' })
      .expect(400);
  });

  it('updates only the title and leaves other task details unchanged', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    const dueDate = new Date('2025-01-15T00:00:00Z');
    await prisma.task.update({
      where: { id: task.id },
      data: { description: 'Existing details', dueDate },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: 'Updated title' })
      .expect(200);
    expect(response.body.title).toBe('Updated title');
    expect(response.body.description).toBe('Existing details');
    expect(new Date(response.body.dueDate)).toEqual(dueDate);
  });

  it('clears the task description with null', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await prisma.task.update({ where: { id: task.id }, data: { description: 'Details' } });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ description: null })
      .expect(200);
    expect(response.body.description).toBeNull();
  });

  it('sets and clears the task due date', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    const dueDate = '2025-03-01T12:00:00.000Z';

    const setResponse = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ dueDate })
      .expect(200);
    expect(new Date(setResponse.body.dueDate)).toEqual(new Date(dueDate));

    const clearResponse = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ dueDate: null })
      .expect(200);
    expect(clearResponse.body.dueDate).toBeNull();
  });

  it('rejects an empty task details update', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer()).patch(`/api/v1/tasks/${task.id}`).send({}).expect(400);
  });

  it('rejects an empty task title update', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: '' })
      .expect(400);
  });

  it('rejects a null task title update', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: null })
      .expect(400);
  });

  it('rejects task title updates longer than 255 characters', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: 't'.repeat(256) })
      .expect(400);
  });

  it('rejects unknown task details fields', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: 'Updated', unexpected: true })
      .expect(400);
  });

  it('returns 404 when updating details of an unknown task', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${randomUUID()}`)
      .send({ title: 'Updated' })
      .expect(404);
  });

  it('rejects a non-UUID task details path parameter', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/tasks/not-a-uuid')
      .send({ title: 'Updated' })
      .expect(400);
  });
});
