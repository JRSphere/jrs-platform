import { describe, expect, it } from 'vitest';
import { INotificationRepository } from '../../application/ports/INotificationRepository';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { CreateNotificationDto } from '../../application/dto/CreateNotificationDto';
import { NotificationResponseDto } from '../../application/dto/NotificationResponseDto';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { TaskCompletedListener } from './TaskCompletedListener';

const unusedRepository: INotificationRepository = {
  async save(notification) { return notification; },
  async findById() { return null; },
  async findByRecipientId(_recipientId, request) {
    return { items: [], total: 0, page: request.page, limit: request.limit };
  },
  async countUnread() { return 0; },
  async update(notification) { return notification; },
};

class CreateNotificationFake extends CreateNotificationUseCase {
  readonly calls: CreateNotificationDto[] = [];
  shouldFail = false;

  constructor() {
    super(unusedRepository);
  }

  override async execute(input: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.calls.push(input);
    if (this.shouldFail) {
      throw new Error('Notification insert failed');
    }
    return {
      id: 'notification-id',
      recipientId: input.recipientId,
      type: input.type,
      message: input.message,
      referenceId: input.referenceId ?? null,
      readAt: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
  }
}

describe('TaskCompletedListener', () => {
  it('creates a notification for the assignee', async () => {
    const createNotification = new CreateNotificationFake();
    await new TaskCompletedListener(createNotification).handle({
      taskId: 'task-1',
      assigneeId: 'assignee-1',
      actorId: 'owner-1',
    });

    expect(createNotification.calls).toEqual([{
      recipientId: 'assignee-1',
      type: NotificationType.TASK_COMPLETED,
      message: 'A task assigned to you was marked as done.',
      referenceId: 'task-1',
    }]);
  });

  it('skips a null assignee', async () => {
    const createNotification = new CreateNotificationFake();
    await new TaskCompletedListener(createNotification).handle({
      taskId: 'task-1',
      assigneeId: null,
    });
    expect(createNotification.calls).toEqual([]);
  });

  it('skips a missing assignee', async () => {
    const createNotification = new CreateNotificationFake();
    await new TaskCompletedListener(createNotification).handle({ taskId: 'task-1' });
    expect(createNotification.calls).toEqual([]);
  });

  it('skips when the actor is the assignee', async () => {
    const createNotification = new CreateNotificationFake();
    await new TaskCompletedListener(createNotification).handle({
      taskId: 'task-1',
      assigneeId: 'owner-1',
      actorId: 'owner-1',
    });
    expect(createNotification.calls).toEqual([]);
  });

  it('warns and skips a blank task id', async () => {
    const createNotification = new CreateNotificationFake();
    await new TaskCompletedListener(createNotification).handle({
      taskId: ' ',
      assigneeId: 'assignee-1',
    });
    expect(createNotification.calls).toEqual([]);
  });

  it('does not throw when notification creation fails', async () => {
    const createNotification = new CreateNotificationFake();
    createNotification.shouldFail = true;
    await expect(new TaskCompletedListener(createNotification).handle({
      taskId: 'task-1',
      assigneeId: 'assignee-1',
    })).resolves.toBeUndefined();
    expect(createNotification.calls).toHaveLength(1);
  });
});
