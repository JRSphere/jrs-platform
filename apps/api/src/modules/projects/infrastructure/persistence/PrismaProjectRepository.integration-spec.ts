import { randomUUID } from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { Project } from '../../domain/entities/Project';
import { PrismaProjectRepository } from './PrismaProjectRepository';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.split('/').pop()?.endsWith('_test')) {
  throw new Error('Integration tests require a DATABASE_URL with a database name ending in _test');
}

let prisma: PrismaService;
let repository: PrismaProjectRepository;
const ownerId = '00000000-0000-4000-8000-000000000001';

beforeAll(async () => {
  prisma = new PrismaService();
  await prisma.onModuleInit();
  repository = new PrismaProjectRepository(prisma);
});
afterAll(async () => prisma.onModuleDestroy());
beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
});

describe('PrismaProjectRepository integration', () => {
  it('saves and finds an equal project', async () => {
    const project = Project.create({ name: 'Platform', ownerId });
    await repository.save(project);
    expect(await repository.findById(project.id)).toEqual(project);
  });

  it('returns null for an unknown id', async () => {
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('returns saved projects in creation order', async () => {
    const earlier = Project.restore({
      id: randomUUID(), name: 'Earlier', description: null, ownerId,
      createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date('2024-01-01T00:00:00Z'),
    });
    const later = Project.restore({
      id: randomUUID(), name: 'Later', description: null, ownerId,
      createdAt: new Date('2024-02-01T00:00:00Z'), updatedAt: new Date('2024-02-01T00:00:00Z'),
    });
    await repository.save(later);
    await repository.save(earlier);
    expect((await repository.findAll()).map((project) => project.id)).toEqual([earlier.id, later.id]);
  });

  it('persists a rename', async () => {
    const project = await repository.save(Project.create({ name: 'Platform', ownerId }));
    project.rename('Renamed');
    expect((await repository.update(project)).name).toBe('Renamed');
  });

  it('throws NotFoundException when updating a missing project', async () => {
    const missing = Project.create({ name: 'Missing', ownerId });
    await expect(repository.update(missing)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a project', async () => {
    const project = await repository.save(Project.create({ name: 'Platform', ownerId }));
    await repository.delete(project.id);
    expect(await repository.findById(project.id)).toBeNull();
  });

  it('does not throw when deleting a missing project', async () => {
    await expect(repository.delete(randomUUID())).resolves.toBeUndefined();
  });
});
