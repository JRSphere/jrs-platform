import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from '../../../application/dto/NotificationResponseDto';
import { NotificationType } from '../../../domain/value-objects/NotificationType';

export class NotificationResponse implements NotificationResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  recipientId!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ type: String, maxLength: 500 })
  message!: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  referenceId!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  readAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
