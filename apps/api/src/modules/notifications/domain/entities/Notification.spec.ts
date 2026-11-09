import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { Notification } from './Notification';
import { NotificationType } from '../value-objects/NotificationType';

const createNotification = (
  overrides: Partial<Parameters<typeof Notification.create>[0]> = {},
) => Notification.create({
  recipientId: 'recipient-1',
  type: NotificationType.TASK_ASSIGNED,
  message: 'Task assigned',
  ...overrides,
});

describe('Notification', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('creates with a generated id, null reference, and unread status by default', () => {
    const notification = createNotification();
    expect(notification.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(notification.referenceId).toBeNull();
    expect(notification.readAt).toBeNull();
    expect(notification.isRead()).toBe(false);
  });

  it('trims the message', () => {
    expect(createNotification({ message: '  Task assigned  ' }).message).toBe('Task assigned');
  });

  it('rejects a blank recipient id', () => {
    expect(() => createNotification({ recipientId: '  ' })).toThrowError(ValidationException);
  });

  it('rejects an empty message', () => {
    expect(() => createNotification({ message: '' })).toThrowError(ValidationException);
  });

  it('rejects a whitespace-only message', () => {
    expect(() => createNotification({ message: '   ' })).toThrowError(ValidationException);
  });

  it('rejects a message longer than 500 characters', () => {
    expect(() => createNotification({ message: 'm'.repeat(501) }))
      .toThrowError(ValidationException);
  });

  it('accepts a 500-character message', () => {
    expect(createNotification({ message: 'm'.repeat(500) }).message).toHaveLength(500);
  });

  it('rejects a blank reference id', () => {
    expect(() => createNotification({ referenceId: ' ' })).toThrowError(ValidationException);
  });

  it('restores exact values without validation', () => {
    const props = {
      id: '',
      recipientId: ' ',
      type: NotificationType.TASK_ASSIGNED,
      message: '',
      referenceId: null,
      readAt: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
    expect(Notification.restore(props)).toMatchObject(props);
  });

  it('sets readAt when marked as read', () => {
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    const notification = createNotification();
    notification.markAsRead();
    expect(notification.readAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    expect(notification.isRead()).toBe(true);
  });

  it('keeps the first readAt when marked as read twice', () => {
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    const notification = createNotification();
    notification.markAsRead();
    vi.setSystemTime(new Date('2024-01-03T00:00:00Z'));
    notification.markAsRead();
    expect(notification.readAt).toEqual(new Date('2024-01-02T00:00:00Z'));
  });

  it('checks whether the notification is for a recipient', () => {
    const notification = createNotification();
    expect(notification.isForRecipient('recipient-1')).toBe(true);
    expect(notification.isForRecipient('recipient-2')).toBe(false);
  });
});
