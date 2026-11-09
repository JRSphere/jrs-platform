import { NotificationType } from '../../domain/value-objects/NotificationType';

export interface NotificationResponseDto {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  referenceId: string | null;
  readAt: Date | null;
  createdAt: Date;
}
