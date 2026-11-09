import { Notification } from '../../domain/entities/Notification';
import { CreateNotificationDto } from '../dto/CreateNotificationDto';
import { NotificationResponseDto } from '../dto/NotificationResponseDto';
import { INotificationRepository } from '../ports/INotificationRepository';

export class CreateNotificationUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(input: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = Notification.create(input);
    const saved = await this.notifications.save(notification);
    return this.toResponse(saved);
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
