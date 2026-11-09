import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/PrismaModule';
import { CountUnreadNotificationsQuery } from './application/use-cases/CountUnreadNotificationsQuery';
import { CreateNotificationUseCase } from './application/use-cases/CreateNotificationUseCase';
import { ListNotificationsQuery } from './application/use-cases/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from './application/use-cases/MarkNotificationReadUseCase';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from './application/ports/INotificationRepository';
import { TaskAssignedListener } from './infrastructure/events/TaskAssignedListener';
import { PrismaNotificationRepository } from './infrastructure/persistence/PrismaNotificationRepository';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    {
      provide: CreateNotificationUseCase,
      useFactory: (notifications: INotificationRepository) =>
        new CreateNotificationUseCase(notifications),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: ListNotificationsQuery,
      useFactory: (notifications: INotificationRepository) =>
        new ListNotificationsQuery(notifications),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: CountUnreadNotificationsQuery,
      useFactory: (notifications: INotificationRepository) =>
        new CountUnreadNotificationsQuery(notifications),
      inject: [NOTIFICATION_REPOSITORY],
    },
    {
      provide: MarkNotificationReadUseCase,
      useFactory: (notifications: INotificationRepository) =>
        new MarkNotificationReadUseCase(notifications),
      inject: [NOTIFICATION_REPOSITORY],
    },
    TaskAssignedListener,
  ],
  exports: [
    CreateNotificationUseCase,
    ListNotificationsQuery,
    CountUnreadNotificationsQuery,
    MarkNotificationReadUseCase,
  ],
})
export class NotificationsModule {}
