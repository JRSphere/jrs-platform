import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { Notification } from '../../domain/entities/Notification';
import { NotificationResponseDto } from '../dto/NotificationResponseDto';
import { INotificationRepository } from '../ports/INotificationRepository';

export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(notificationId: string, actorId: string): Promise<NotificationResponseDto> {
    const notification = await this.notifications.findById(notificationId);
    if (!notification || !notification.isForRecipient(actorId)) {
      throw new NotFoundException('Notification not found');
    }
    notification.markAsRead();
    const updated = await this.notifications.update(notification);
    return this.toResponse(updated);
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
