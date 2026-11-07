import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Project } from './Project';

const createProject = (overrides: Partial<Parameters<typeof Project.create>[0]> = {}) =>
  Project.create({ name: 'Platform', ownerId: 'owner-1', ...overrides });

describe('Project', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('creates with a generated id and null description by default', () => {
    const project = createProject();
    expect(project.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(project.description).toBeNull();
  });

  it('trims the name', () => {
    expect(createProject({ name: '  Platform  ' }).name).toBe('Platform');
  });

  it('accepts a 255-character name', () => {
    expect(createProject({ name: 'p'.repeat(255) }).name).toHaveLength(255);
  });

  it('rejects an empty name', () => {
    expect(() => createProject({ name: '' })).toThrowError(ValidationException);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createProject({ name: '   ' })).toThrowError(ValidationException);
  });

  it('rejects a 256-character name', () => {
    expect(() => createProject({ name: 'p'.repeat(256) })).toThrowError(ValidationException);
  });

  it('rejects a blank owner id', () => {
    expect(() => createProject({ ownerId: '  ' })).toThrowError(ValidationException);
  });

  it('restores exact values without validation or changing updatedAt', () => {
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const updatedAt = new Date('2024-02-01T00:00:00Z');
    const props = {
      id: '',
      name: '',
      description: null,
      ownerId: ' ',
      createdAt,
      updatedAt,
    };
    const project = Project.restore(props);
    expect(project).toMatchObject(props);
    expect(project.updatedAt).toBe(updatedAt);
  });

  it('renames and updates updatedAt', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const project = createProject();
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    project.rename('  New name  ');
    expect(project.name).toBe('New name');
    expect(project.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
  });

  it('rejects an invalid name when renaming', () => {
    const project = createProject();
    expect(() => project.rename(' ')).toThrowError(ValidationException);
  });

  it('sets the description and updates updatedAt', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const project = createProject();
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    project.changeDescription('Details');
    expect(project.description).toBe('Details');
    expect(project.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
  });

  it('clears the description and updates updatedAt', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const project = createProject({ description: 'Details' });
    vi.setSystemTime(new Date('2024-01-03T00:00:00Z'));
    project.changeDescription(null);
    expect(project.description).toBeNull();
    expect(project.updatedAt).toEqual(new Date('2024-01-03T00:00:00Z'));
  });

  it('updates only the name', () => {
    const project = createProject({ description: 'Existing details' });
    project.updateDetails({ name: 'Updated' });
    expect(project.name).toBe('Updated');
    expect(project.description).toBe('Existing details');
  });

  it('updates only the description', () => {
    const project = createProject();
    project.updateDetails({ description: 'Details' });
    expect(project.description).toBe('Details');
    expect(project.name).toBe('Platform');
  });

  it('clears the description with null', () => {
    const project = createProject({ description: 'Details' });
    project.updateDetails({ description: null });
    expect(project.description).toBeNull();
  });

  it('trims an updated name', () => {
    const project = createProject();
    project.updateDetails({ name: '  Updated  ' });
    expect(project.name).toBe('Updated');
  });

  it.each(['', '   ', 'p'.repeat(256)])('rejects invalid updated name %j', (name) => {
    const project = createProject();
    expect(() => project.updateDetails({ name })).toThrowError(ValidationException);
  });

  it('rejects empty changes', () => {
    const project = createProject();
    expect(() => project.updateDetails({})).toThrowError(ValidationException);
  });

  it('leaves every field and updatedAt unchanged when name validation fails', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const project = createProject({ description: 'Existing details' });
    const original = {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));

    expect(() => project.updateDetails({ name: ' ', description: null }))
      .toThrowError(ValidationException);
    expect(project).toEqual(original);
  });

  it('touches updatedAt once after a successful update', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const project = createProject();
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    project.updateDetails({ name: 'Updated', description: 'Details' });
    expect(project.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
  });
});
