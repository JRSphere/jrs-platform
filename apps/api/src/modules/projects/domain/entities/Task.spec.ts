import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Task } from './Task';
import { TaskStatus } from '../value-objects/TaskStatus';

const createTask = (overrides: Partial<Parameters<typeof Task.create>[0]> = {}) =>
  Task.create({ title: 'Review proposal', projectId: 'project-1', ...overrides });

describe('Task', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('creates a TODO task with a generated id and null optional fields', () => {
      const task = createTask();

      expect(task.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.description).toBeNull();
      expect(task.assigneeId).toBeNull();
      expect(task.dueDate).toBeNull();
    });

    it('trims the title', () => {
      expect(createTask({ title: '  Review proposal  ' }).title).toBe('Review proposal');
    });

    it('accepts a 255-character title', () => {
      expect(createTask({ title: 't'.repeat(255) }).title).toHaveLength(255);
    });

    it.each([
      ['empty title', { title: '' }],
      ['whitespace-only title', { title: '   ' }],
      ['256-character title', { title: 't'.repeat(256) }],
      ['blank project id', { projectId: '  ' }],
      ['blank assignee id', { assigneeId: '  ' }],
    ])('rejects a %s', (_description, props) => {
      expect(() => createTask(props)).toThrowError(ValidationException);
    });
  });

  describe('restore', () => {
    it('returns the supplied values without validation or changing updatedAt', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-02-01T00:00:00Z');
      const dueDate = new Date('2024-03-01T00:00:00Z');
      const props = {
        id: '',
        projectId: ' ',
        title: '',
        description: null,
        assigneeId: null,
        status: TaskStatus.DONE,
        dueDate,
        createdAt,
        updatedAt,
      };

      const task = Task.restore(props);

      expect(task).toMatchObject(props);
      expect(task.updatedAt).toBe(updatedAt);
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('changeStatus', () => {
    it('updates status and updatedAt for a valid move', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const task = createTask();
      vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));

      task.changeStatus(TaskStatus.IN_PROGRESS);

      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    });

    it('throws ValidationException with the rejected transition message', () => {
      const task = createTask();
      let thrown: unknown;

      try {
        task.changeStatus(TaskStatus.DONE);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(ValidationException);
      expect(thrown).toHaveProperty('message', 'Cannot move task from TODO to DONE');
    });
  });

  describe('assignment', () => {
    it('assigns an assignee and updates updatedAt', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const task = createTask();
      vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));

      task.assign('user-1');

      expect(task.assigneeId).toBe('user-1');
      expect(task.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    });

    it('throws ValidationException when assigning a blank id', () => {
      const task = createTask();

      expect(() => task.assign('  ')).toThrowError(ValidationException);
    });

    it('unassigns the task and updates updatedAt', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const task = createTask({ assigneeId: 'user-1' });
      vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));

      task.unassign();

      expect(task.assigneeId).toBeNull();
      expect(task.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    });
  });

  describe('updateDetails', () => {
    it('updates only the title', () => {
      const task = createTask({ description: 'Details', dueDate: new Date('2024-01-01') });
      task.updateDetails({ title: 'Updated' });
      expect(task.title).toBe('Updated');
      expect(task.description).toBe('Details');
      expect(task.dueDate).toEqual(new Date('2024-01-01'));
    });

    it('updates only the description', () => {
      const task = createTask();
      task.updateDetails({ description: 'Details' });
      expect(task.description).toBe('Details');
    });

    it('updates only the due date', () => {
      const task = createTask();
      const dueDate = new Date('2024-03-01T00:00:00Z');
      task.updateDetails({ dueDate });
      expect(task.dueDate).toBe(dueDate);
    });

    it('clears the description with null', () => {
      const task = createTask({ description: 'Details' });
      task.updateDetails({ description: null });
      expect(task.description).toBeNull();
    });

    it('clears the due date with null', () => {
      const task = createTask({ dueDate: new Date('2024-03-01T00:00:00Z') });
      task.updateDetails({ dueDate: null });
      expect(task.dueDate).toBeNull();
    });

    it('trims an updated title', () => {
      const task = createTask();
      task.updateDetails({ title: '  Updated  ' });
      expect(task.title).toBe('Updated');
    });

    it.each(['', '   ', 't'.repeat(256)])('rejects invalid title %j', (title) => {
      const task = createTask();
      expect(() => task.updateDetails({ title })).toThrowError(ValidationException);
    });

    it('rejects empty changes', () => {
      const task = createTask();
      expect(() => task.updateDetails({})).toThrowError(ValidationException);
    });

    it('leaves every field and updatedAt unchanged when title validation fails', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const dueDate = new Date('2024-02-01T00:00:00Z');
      const task = createTask({ description: 'Original', assigneeId: 'user-1', dueDate });
      const original = {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
      vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));

      expect(() =>
        task.updateDetails({ title: '', description: null, dueDate: null }),
      ).toThrowError(ValidationException);
      expect(task).toEqual(original);
    });

    it('touches updatedAt once after a successful update', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const task = createTask();
      vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
      task.updateDetails({ title: 'Updated', description: 'Details' });
      expect(task.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    });
  });
});
