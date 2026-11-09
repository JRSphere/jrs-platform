import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/PrismaService';
import { CountUnreadNotificationsQuery } from './application/use-cases/CountUnreadNotificationsQuery';
import { CreateNotificationUseCase } from './application/use-cases/CreateNotificationUseCase';
import { ListNotificationsQuery } from './application/use-cases/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from './application/use-cases/MarkNotificationReadUseCase';
import { TaskAssignedListener } from './infrastructure/events/TaskAssignedListener';
import { NotificationsModule } from './NotificationsModule';

describe('NotificationsModule', () => {
  let moduleRef: TestingModule | undefined;

  afterEach(async () => {
    await moduleRef?.close();
  });

  it.each([
    CreateNotificationUseCase,
    ListNotificationsQuery,
    CountUnreadNotificationsQuery,
    MarkNotificationReadUseCase,
    TaskAssignedListener,
  ].map((provider) => [provider.name, provider] as const))('resolves %s', async (_name, provider) => {
    moduleRef = await Test.createTestingModule({ imports: [NotificationsModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(provider)).toBeInstanceOf(provider);
  });
});
