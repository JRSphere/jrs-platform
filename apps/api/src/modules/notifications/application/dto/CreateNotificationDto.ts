import { NotificationType } from '../../domain/value-objects/NotificationType';

export interface CreateNotificationDto {
  recipientId: string;
  type: NotificationType;
  message: string;
  referenceId?: string;
}
