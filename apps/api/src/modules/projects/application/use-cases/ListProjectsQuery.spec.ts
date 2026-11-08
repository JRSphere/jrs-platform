import { describe, expect, it } from 'vitest';
import { Project } from '../../domain/entities/Project';
import { Page, PageRequest } from '../dto/Pagination';
import { IProjectRepository } from '../ports/IProjectRepository';
import { ListProjectsQuery } from './ListProjectsQuery';

class ProjectRepositoryFake implements IProjectRepository {
  constructor(private readonly projects: Project[]) {}

  async save(project: Project): Promise<Project> { return project; }
  async findById(id: string): Promise<Project | null> {
    return this.projects.find((project) => project.id === id) ?? null;
  }
  async findAll(request: PageRequest, ownerId: string): Promise<Page<Project>> {
    const owned = this.projects.filter((project) => project.isOwnedBy(ownerId));
    return {
      items: owned.slice((request.page - 1) * request.limit, request.page * request.limit),
      total: owned.length,
      page: request.page,
      limit: request.limit,
    };
  }
  async update(project: Project): Promise<Project> { return project; }
  async delete(): Promise<void> {}
}

const createProjects = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    Project.create({ name: `Project ${index + 1}`, ownerId: 'owner-1' }),
  );

describe('ListProjectsQuery', () => {
  it('returns the requested page with the full total', async () => {
    const projects = createProjects(5);
    const result = await new ListProjectsQuery(new ProjectRepositoryFake(projects)).execute(
      { page: 2, limit: 2 },
      'owner-1',
    );

    expect(result).toMatchObject({
      items: [{ id: projects[2].id }, { id: projects[3].id }],
      total: 5,
      page: 2,
      limit: 2,
    });
  });

  it('returns an empty page past the end with the actual total', async () => {
    const projects = createProjects(3);
    const result = await new ListProjectsQuery(new ProjectRepositoryFake(projects)).execute(
      { page: 3, limit: 2 },
      'owner-1',
    );

    expect(result).toEqual({ items: [], total: 3, page: 3, limit: 2 });
  });

  it('returns an empty page and zero total for an empty repository', async () => {
    const result = await new ListProjectsQuery(new ProjectRepositoryFake([])).execute(
      { page: 1, limit: 20 },
      'owner-1',
    );

    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('lists only the actor-owned projects and returns their total', async () => {
    const ownProject = Project.create({ name: 'Mine', ownerId: 'owner-1' });
    const otherProject = Project.create({ name: 'Theirs', ownerId: 'owner-2' });
    const result = await new ListProjectsQuery(
      new ProjectRepositoryFake([ownProject, otherProject]),
    ).execute({ page: 1, limit: 20 }, 'owner-1');

    expect(result.items.map((project) => project.id)).toEqual([ownProject.id]);
    expect(result.total).toBe(1);
  });
});
