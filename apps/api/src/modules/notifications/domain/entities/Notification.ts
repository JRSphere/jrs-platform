import { randomUUID } from 'crypto';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';
import { NotificationType } from '../value-objects/NotificationType';

export interface CreateNotificationProps {
  recipientId: string;
  type: NotificationType;
  message: string;
  referenceId?: string;
}

export interface RestoreNotificationProps {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  referenceId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export class Notification {
  readonly id: string;
  readonly recipientId: string;
  readonly type: NotificationType;
  message: string;
  referenceId: string | null;
  readAt: Date | null;
  readonly createdAt: Date;

  private constructor(props: RestoreNotificationProps) {
    this.id = props.id;
    this.recipientId = props.recipientId;
    this.type = props.type;
    this.message = props.message;
    this.referenceId = props.referenceId;
    this.readAt = props.readAt;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateNotificationProps): Notification {
    const message = props.message.trim();
    if (props.recipientId.trim().length === 0) {
      throw new ValidationException('Recipient ID is required');
    }
    if (message.length === 0) {
      throw new ValidationException('Notification message is required');
    }
    if (message.length > 500) {
      throw new ValidationException('Notification message cannot exceed 500 characters');
    }
    if (props.referenceId !== undefined && props.referenceId.trim().length === 0) {
      throw new ValidationException('Reference ID cannot be blank');
    }

    return new Notification({
      id: randomUUID(),
      recipientId: props.recipientId,
      type: props.type,
      message,
      referenceId: props.referenceId ?? null,
      readAt: null,
      createdAt: new Date(),
    });
  }

  static restore(props: RestoreNotificationProps): Notification {
    return new Notification(props);
  }

  markAsRead(): void {
    if (this.readAt === null) {
      this.readAt = new Date();
    }
  }

  isRead(): boolean {
    return this.readAt !== null;
  }

  isForRecipient(userId: string): boolean {
    return this.recipientId === userId;
  }
}
