import { describe, expect, it } from 'vitest';
import { INotificationRepository } from '../../application/ports/INotificationRepository';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { CreateNotificationDto } from '../../application/dto/CreateNotificationDto';
import { NotificationResponseDto } from '../../application/dto/NotificationResponseDto';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { TaskAssignedListener } from './TaskAssignedListener';

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

describe('TaskAssignedListener', () => {
  it('creates a notification for the assignee referencing the task', async () => {
    const createNotification = new CreateNotificationFake();
    const listener = new TaskAssignedListener(createNotification);

    await listener.handle({
      taskId: 'task-1',
      projectId: 'project-1',
      assigneeId: 'assignee-1',
    });

    expect(createNotification.calls).toEqual([{
      recipientId: 'assignee-1',
      type: NotificationType.TASK_ASSIGNED,
      message: 'You have been assigned a task.',
      referenceId: 'task-1',
    }]);
  });

  it('ignores a missing assignee id without throwing', async () => {
    const createNotification = new CreateNotificationFake();
    const listener = new TaskAssignedListener(createNotification);

    await expect(listener.handle({ taskId: 'task-1', projectId: 'project-1' })).resolves.toBeUndefined();
    expect(createNotification.calls).toEqual([]);
  });

  it('ignores a blank task id without throwing', async () => {
    const createNotification = new CreateNotificationFake();
    const listener = new TaskAssignedListener(createNotification);

    await expect(listener.handle({
      taskId: ' ',
      projectId: 'project-1',
      assigneeId: 'assignee-1',
    })).resolves.toBeUndefined();
    expect(createNotification.calls).toEqual([]);
  });

  it('does not throw when notification creation fails', async () => {
    const createNotification = new CreateNotificationFake();
    createNotification.shouldFail = true;
    const listener = new TaskAssignedListener(createNotification);

    await expect(listener.handle({
      taskId: 'task-1',
      projectId: 'project-1',
      assigneeId: 'assignee-1',
    })).resolves.toBeUndefined();
    expect(createNotification.calls).toHaveLength(1);
  });
});
