import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
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
const otherOwnerId = '00000000-0000-4000-8000-000000000003';
const assigneeId = '00000000-0000-4000-8000-000000000002';
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
    get: (path: string) => withTestUser(supertest(server).get(path), userId),
    post: (path: string) => withTestUser(supertest(server).post(path), userId),
    patch: (path: string) => withTestUser(supertest(server).patch(path), userId),
    delete: (path: string) => withTestUser(supertest(server).delete(path), userId),
  };
}

async function insertProject(
  name = 'Platform',
  createdAt = new Date(),
  projectOwnerId = ownerId,
) {
  return prisma.project.create({
    data: { id: randomUUID(), name, ownerId: projectOwnerId, createdAt, updatedAt: createdAt },
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
      'DELETE /api/v1/projects/{projectId}',
      'DELETE /api/v1/tasks/{taskId}',
      'GET /api/v1/projects',
      'GET /api/v1/projects/{projectId}/tasks',
      'PATCH /api/v1/projects/{projectId}',
      'PATCH /api/v1/tasks/{taskId}',
      'PATCH /api/v1/tasks/{taskId}/assignee',
      'PATCH /api/v1/tasks/{taskId}/status',
      'POST /api/v1/projects',
      'POST /api/v1/projects/{projectId}/tasks',
    ]);
  });

  it.each([
    ['POST', '/api/v1/projects'],
    ['GET', '/api/v1/projects'],
    ['PATCH', '/api/v1/projects/00000000-0000-4000-8000-000000000010'],
    ['DELETE', '/api/v1/projects/00000000-0000-4000-8000-000000000010'],
    ['POST', '/api/v1/projects/00000000-0000-4000-8000-000000000010/tasks'],
    ['GET', '/api/v1/projects/00000000-0000-4000-8000-000000000010/tasks'],
    ['PATCH', '/api/v1/tasks/00000000-0000-4000-8000-000000000010/status'],
    ['PATCH', '/api/v1/tasks/00000000-0000-4000-8000-000000000010/assignee'],
    ['PATCH', '/api/v1/tasks/00000000-0000-4000-8000-000000000010'],
    ['DELETE', '/api/v1/tasks/00000000-0000-4000-8000-000000000010'],
  ] as const)('rejects unauthenticated %s %s', async (method, path) => {
    const client = supertest(app.getHttpServer());
    const test = method === 'POST'
      ? client.post(path)
      : method === 'GET'
        ? client.get(path)
        : method === 'PATCH'
          ? client.patch(path)
          : client.delete(path);
    await test.expect(401);
  });

  it('returns an empty project page for an empty database', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .expect(200);
    expect(response.body).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('paginates projects and reports the full total', async () => {
    await insertProject('First', new Date('2025-01-01T00:00:00Z'));
    await insertProject('Second', new Date('2025-01-02T00:00:00Z'));
    await insertProject('Third', new Date('2025-01-03T00:00:00Z'));

    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .query({ limit: 2 })
      .expect(200);
    expect(firstPage.body).toMatchObject({ page: 1, limit: 2, total: 3 });
    expect(firstPage.body.items).toHaveLength(2);

    const secondPage = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .query({ page: 2, limit: 2 })
      .expect(200);
    expect(secondPage.body).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      items: [{ name: 'Third' }],
    });
  });

  it('returns an empty project page beyond the end with the actual total', async () => {
    await insertProject('First');
    await insertProject('Second');

    const response = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .query({ page: 3, limit: 1 })
      .expect(200);
    expect(response.body).toMatchObject({ items: [], total: 2, page: 3, limit: 1 });
  });

  it('rejects a zero project page limit', async () => {
    await request(app.getHttpServer()).get('/api/v1/projects').query({ limit: 0 }).expect(400);
  });

  it('rejects a project page limit above 100', async () => {
    await request(app.getHttpServer()).get('/api/v1/projects').query({ limit: 101 }).expect(400);
  });

  it('rejects a zero project page number', async () => {
    await request(app.getHttpServer()).get('/api/v1/projects').query({ page: 0 }).expect(400);
  });

  it('rejects a non-numeric project page limit', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/projects')
      .query({ limit: 'abc' })
      .expect(400);
  });

  it('rejects unknown project list query parameters', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/projects')
      .query({ unknown: 'value' })
      .expect(400);
  });

  it('creates a project', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Platform' })
      .expect(201);
    expect(response.body).toMatchObject({ id: expect.any(String), name: 'Platform', ownerId });
  });

  it('rejects an empty project name', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: '' })
      .expect(400);
  });

  it('rejects unknown project fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Platform', unexpected: true })
      .expect(400);
  });

  it('rejects an ownerId supplied in the project body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Platform', ownerId })
      .expect(400);
  });

  it('lists only the caller’s projects and returns their total', async () => {
    const ownProject = await insertProject('Own');
    await insertProject('Other 1', new Date(), otherOwnerId);
    await insertProject('Other 2', new Date(), otherOwnerId);

    const response = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .expect(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items.map((project: { id: string }) => project.id))
      .toEqual([ownProject.id]);
  });

  it('does not update another user’s project', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);

    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ name: 'Changed' })
      .expect(404);
    expect((await prisma.project.findUnique({ where: { id: project.id } }))?.name)
      .toBe('Private');
  });

  it('does not delete another user’s project', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);

    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${project.id}`)
      .expect(404);
    expect(await prisma.project.findUnique({ where: { id: project.id } })).not.toBeNull();
  });

  it('does not create a task in another user’s project', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${project.id}/tasks`)
      .send({ title: 'Review' })
      .expect(404);
    expect(await prisma.task.count({ where: { projectId: project.id } })).toBe(0);
  });

  it('does not list tasks in another user’s project', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);
    await insertTask(project.id);

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .expect(404);
  });

  it('allows the project owner to use authenticated task-id routes', async () => {
    const project = await insertProject('Owned');
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/assignee`)
      .send({ assigneeId })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: 'Updated' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${task.id}`)
      .expect(204);
  });

  it('does not update another user’s task status', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(404);
    expect(await prisma.task.findUnique({ where: { id: task.id } }))
      .toMatchObject({ status: 'TODO', assigneeId: null, title: 'Review' });
  });

  it('does not assign another user’s task', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}/assignee`)
      .send({ assigneeId })
      .expect(404);
    expect(await prisma.task.findUnique({ where: { id: task.id } }))
      .toMatchObject({ status: 'TODO', assigneeId: null, title: 'Review' });
  });

  it('does not edit another user’s task details', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);
    const task = await insertTask(project.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: 'Changed' })
      .expect(404);
    expect(await prisma.task.findUnique({ where: { id: task.id } }))
      .toMatchObject({ status: 'TODO', assigneeId: null, title: 'Review' });
  });

  it('does not delete another user’s task', async () => {
    const project = await insertProject('Private', new Date(), otherOwnerId);
    const task = await insertTask(project.id);

    await request(app.getHttpServer()).delete(`/api/v1/tasks/${task.id}`).expect(404);
    expect(await prisma.task.findUnique({ where: { id: task.id } }))
      .toMatchObject({ status: 'TODO', assigneeId: null, title: 'Review' });
  });

  it('updates only the project name and leaves its description unchanged', async () => {
    const project = await insertProject();
    await prisma.project.update({
      where: { id: project.id },
      data: { description: 'Existing details' },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ name: 'Updated' })
      .expect(200);
    expect(response.body.name).toBe('Updated');
    expect(response.body.description).toBe('Existing details');
  });

  it('clears the project description with null', async () => {
    const project = await insertProject();
    await prisma.project.update({
      where: { id: project.id },
      data: { description: 'Existing details' },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ description: null })
      .expect(200);
    expect(response.body.description).toBeNull();
  });

  it('sets the project description', async () => {
    const project = await insertProject();
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ description: 'New details' })
      .expect(200);
    expect(response.body.description).toBe('New details');
  });

  it('rejects an empty project details update', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({})
      .expect(400);
  });

  it('rejects an empty project name update', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ name: '' })
      .expect(400);
  });

  it('rejects a null project name update', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ name: null })
      .expect(400);
  });

  it('rejects project name updates longer than 255 characters', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ name: 'p'.repeat(256) })
      .expect(400);
  });

  it('rejects unknown project details fields', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${project.id}`)
      .send({ name: 'Updated', ownerId })
      .expect(400);
  });

  it('returns 404 when updating an unknown project', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${randomUUID()}`)
      .send({ name: 'Updated' })
      .expect(404);
  });

  it('rejects a non-UUID project details path parameter', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/projects/not-a-uuid')
      .send({ name: 'Updated' })
      .expect(400);
  });

  it('deletes a task and removes it from the project task list', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);

    await request(app.getHttpServer()).delete(`/api/v1/tasks/${task.id}`).expect(204);
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .expect(200);
    expect(response.body.items).toEqual([]);
  });

  it('returns 404 when deleting an unknown task', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${randomUUID()}`)
      .expect(404);
  });

  it('returns 404 when deleting the same task twice', async () => {
    const project = await insertProject();
    const task = await insertTask(project.id);
    await request(app.getHttpServer()).delete(`/api/v1/tasks/${task.id}`).expect(204);
    await request(app.getHttpServer()).delete(`/api/v1/tasks/${task.id}`).expect(404);
  });

  it('rejects a non-UUID task delete path parameter', async () => {
    await request(app.getHttpServer()).delete('/api/v1/tasks/not-a-uuid').expect(400);
  });

  it('deletes a project and makes its task list unavailable', async () => {
    const project = await insertProject();
    await request(app.getHttpServer()).delete(`/api/v1/projects/${project.id}`).expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .expect(404);
  });

  it('deletes a project and its tasks through the database cascade', async () => {
    const project = await insertProject();
    await insertTask(project.id);
    await request(app.getHttpServer()).delete(`/api/v1/projects/${project.id}`).expect(204);

    expect(await prisma.task.count({ where: { projectId: project.id } })).toBe(0);
  });

  it('deletes a project without affecting other projects or their tasks', async () => {
    const deletedProject = await insertProject('Deleted');
    const retainedProject = await insertProject('Retained');
    await insertTask(deletedProject.id);
    const retainedTask = await insertTask(retainedProject.id);

    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${deletedProject.id}`)
      .expect(204);

    expect(await prisma.project.findUnique({ where: { id: retainedProject.id } }))
      .not.toBeNull();
    expect(await prisma.task.findUnique({ where: { id: retainedTask.id } }))
      .not.toBeNull();
  });

  it('returns 404 when deleting an unknown project', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${randomUUID()}`)
      .expect(404);
  });

  it('rejects a non-UUID project delete path parameter', async () => {
    await request(app.getHttpServer()).delete('/api/v1/projects/not-a-uuid').expect(400);
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
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].projectId).toBe(project.id);
  });

  it('defaults task pagination to page 1 and limit 20', async () => {
    const project = await insertProject();
    await Promise.all(Array.from({ length: 21 }, () => insertTask(project.id)));

    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .expect(200);
    expect(response.body).toMatchObject({ page: 1, limit: 20, total: 21 });
    expect(response.body.items).toHaveLength(20);
  });

  it('returns the requested limit and the full task total', async () => {
    const project = await insertProject();
    await Promise.all(Array.from({ length: 3 }, () => insertTask(project.id)));

    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ limit: 2 })
      .expect(200);
    expect(response.body).toMatchObject({ page: 1, limit: 2, total: 3 });
    expect(response.body.items).toHaveLength(2);
  });

  it('returns an empty page beyond the end with the actual total', async () => {
    const project = await insertProject();
    await Promise.all(Array.from({ length: 3 }, () => insertTask(project.id)));

    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ page: 4, limit: 2 })
      .expect(200);
    expect(response.body).toMatchObject({ page: 4, limit: 2, total: 3, items: [] });
  });

  it('rejects a zero task page limit', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ limit: 0 })
      .expect(400);
  });

  it('rejects a task page limit above 100', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ limit: 101 })
      .expect(400);
  });

  it('rejects a zero task page number', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ page: 0 })
      .expect(400);
  });

  it('rejects a non-numeric task page limit', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ limit: 'abc' })
      .expect(400);
  });

  it('rejects unknown task list query parameters', async () => {
    const project = await insertProject();
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/tasks`)
      .query({ unknown: 'value' })
      .expect(400);
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
