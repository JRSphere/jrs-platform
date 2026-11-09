import { Notification } from '../../domain/entities/Notification';
import { Page, PageRequest } from '../dto/Pagination';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByRecipientId(
    recipientId: string,
    request: PageRequest,
    unreadOnly: boolean,
  ): Promise<Page<Notification>>;
  countUnread(recipientId: string): Promise<number>;
  update(notification: Notification): Promise<Notification>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
