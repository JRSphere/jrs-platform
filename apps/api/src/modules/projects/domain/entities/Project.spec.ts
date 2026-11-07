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
});
