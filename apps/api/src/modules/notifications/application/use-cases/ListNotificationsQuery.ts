import { Notification } from '../../domain/entities/Notification';
import { NotificationResponseDto } from '../dto/NotificationResponseDto';
import { Page, PageRequest } from '../dto/Pagination';
import { INotificationRepository } from '../ports/INotificationRepository';

export class ListNotificationsQuery {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(
    actorId: string,
    request: PageRequest,
    unreadOnly: boolean,
  ): Promise<Page<NotificationResponseDto>> {
    const result = await this.notifications.findByRecipientId(actorId, request, unreadOnly);
    return {
      items: result.items.map((notification) => this.toResponse(notification)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  private toResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      recipientId: notification.recipientId,
      type: notification.type,
      message: notification.message,
      referenceId: notification.referenceId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
