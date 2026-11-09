import { Injectable } from '@nestjs/common';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { Notification } from '../../domain/entities/Notification';
import { NotificationType } from '../../domain/value-objects/NotificationType';
import { Page, PageRequest } from '../../application/dto/Pagination';
import { INotificationRepository } from '../../application/ports/INotificationRepository';

const notificationTypes: Readonly<Record<string, NotificationType>> = {
  [NotificationType.TASK_ASSIGNED]: NotificationType.TASK_ASSIGNED,
};

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.prisma.notification.create({
      data: {
        id: notification.id,
        recipientId: notification.recipientId,
        type: notification.type,
        message: notification.message,
        referenceId: notification.referenceId,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      },
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    return notification ? this.toDomain(notification) : null;
  }

  async findByRecipientId(
    recipientId: string,
    request: PageRequest,
    unreadOnly: boolean,
  ): Promise<Page<Notification>> {
    const where = { recipientId, ...(unreadOnly ? { readAt: null } : {}) };
    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: (request.page - 1) * request.limit,
        take: request.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.notification.count({ where }),
    ]);
    return {
      items: notifications.map((notification) => this.toDomain(notification)),
      total,
      page: request.page,
      limit: request.limit,
    };
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.prisma.notification.count({ where: { recipientId, readAt: null } });
  }

  async update(notification: Notification): Promise<Notification> {
    try {
      const updated = await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          recipientId: notification.recipientId,
          type: notification.type,
          message: notification.message,
          referenceId: notification.referenceId,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        },
      });
      return this.toDomain(updated);
    } catch (error) {
      if (isMissingRecord(error)) {
        throw new NotFoundException('Notification not found');
      }
      throw error;
    }
  }

  private toDomain(notification: {
    id: string;
    recipientId: string;
    type: string;
    message: string;
    referenceId: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): Notification {
    const type = notificationTypes[notification.type];
    if (type === undefined) {
      throw new Error(`Unknown notification type: ${notification.type}`);
    }
    return Notification.restore({ ...notification, type });
  }
}

function isMissingRecord(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
}
