import { describe, expect, it } from 'vitest';
import { canTransition, TaskStatus } from './TaskStatus';

describe('canTransition', () => {
  it.each([
    [TaskStatus.TODO, TaskStatus.TODO, false],
    [TaskStatus.TODO, TaskStatus.IN_PROGRESS, true],
    [TaskStatus.TODO, TaskStatus.DONE, false],
    [TaskStatus.IN_PROGRESS, TaskStatus.TODO, true],
    [TaskStatus.IN_PROGRESS, TaskStatus.IN_PROGRESS, false],
    [TaskStatus.IN_PROGRESS, TaskStatus.DONE, true],
    [TaskStatus.DONE, TaskStatus.TODO, false],
    [TaskStatus.DONE, TaskStatus.IN_PROGRESS, true],
    [TaskStatus.DONE, TaskStatus.DONE, false],
  ])('returns %s for %s -> %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});
