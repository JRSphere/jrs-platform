import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../../application/dto/Pagination';
import { NotificationResponseDto } from '../../../application/dto/NotificationResponseDto';
import { NotificationResponse } from './NotificationResponse';

export class NotificationPageResponse implements Page<NotificationResponseDto> {
  @ApiProperty({ type: NotificationResponse, isArray: true })
  items!: NotificationResponse[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  limit!: number;
}
