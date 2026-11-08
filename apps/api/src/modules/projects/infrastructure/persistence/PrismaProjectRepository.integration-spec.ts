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
    expect((await repository.findAll({ page: 1, limit: 20 }, ownerId)).items.map((project) => project.id))
      .toEqual([earlier.id, later.id]);
  });

  it('paginates in creation order and reports the full total', async () => {
    const projects = await Promise.all(
      Array.from({ length: 5 }, (_, index) => {
        const createdAt = new Date(Date.UTC(2025, 0, 1, 0, 0, index));
        return repository.save(Project.restore({
          id: randomUUID(),
          name: `Project ${index + 1}`,
          description: null,
          ownerId,
          createdAt,
          updatedAt: createdAt,
        }));
      }),
    );
    const pageOne = await repository.findAll({ page: 1, limit: 2 }, ownerId);
    const pageThree = await repository.findAll({ page: 3, limit: 2 }, ownerId);
    const pageFour = await repository.findAll({ page: 4, limit: 2 }, ownerId);

    expect(pageOne.items.map((project) => project.id)).toEqual(projects.slice(0, 2).map((project) => project.id));
    expect(pageThree.items.map((project) => project.id)).toEqual([projects[4].id]);
    expect(pageFour.items).toEqual([]);
    expect([pageOne.total, pageThree.total, pageFour.total]).toEqual([5, 5, 5]);
  });

  it('filters project items and total by owner', async () => {
    const otherOwner = '00000000-0000-4000-8000-000000000002';
    await repository.save(Project.create({ name: 'Owned', ownerId }));
    await repository.save(Project.create({ name: 'Other', ownerId: otherOwner }));

    const page = await repository.findAll({ page: 1, limit: 20 }, ownerId);
    expect(page.total).toBe(1);
    expect(page.items.map((project) => project.name)).toEqual(['Owned']);
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
