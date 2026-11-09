import { INotificationRepository } from '../ports/INotificationRepository';

export class CountUnreadNotificationsQuery {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(actorId: string): Promise<number> {
    return this.notifications.countUnread(actorId);
  }
}
