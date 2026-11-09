import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedGuard } from '../../../../infrastructure/http/auth/AuthenticatedGuard';
import { CurrentUserId } from '../../../../infrastructure/http/auth/CurrentUserId';
import { CountUnreadNotificationsQuery } from '../../application/use-cases/CountUnreadNotificationsQuery';
import { ListNotificationsQuery } from '../../application/use-cases/ListNotificationsQuery';
import { MarkNotificationReadUseCase } from '../../application/use-cases/MarkNotificationReadUseCase';
import { ErrorResponse } from './dto/ErrorResponse';
import { NotificationPageQuery } from './dto/NotificationPageQuery';
import { NotificationPageResponse } from './dto/NotificationPageResponse';
import { NotificationResponse } from './dto/NotificationResponse';
import { UnreadCountResponse } from './dto/UnreadCountResponse';

@Controller('api/v1/notifications')
@UseGuards(AuthenticatedGuard)
@ApiBearerAuth()
@ApiTags('notifications')
export class NotificationsController {
  constructor(
    @Inject(ListNotificationsQuery)
    private readonly listNotifications: ListNotificationsQuery,
    @Inject(CountUnreadNotificationsQuery)
    private readonly countUnreadNotifications: CountUnreadNotificationsQuery,
    @Inject(MarkNotificationReadUseCase)
    private readonly markNotificationRead: MarkNotificationReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  @ApiOkResponse({ type: NotificationPageResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  list(
    @Query() query: NotificationPageQuery,
    @CurrentUserId() actorId: string,
  ) {
    return this.listNotifications.execute(
      actorId,
      { page: query.page, limit: query.limit },
      query.unreadOnly,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count unread notifications' })
  @ApiOkResponse({ type: UnreadCountResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async unreadCount(@CurrentUserId() actorId: string): Promise<UnreadCountResponse> {
    return { count: await this.countUnreadNotifications.execute(actorId) };
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ type: NotificationResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  markAsRead(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @CurrentUserId() actorId: string,
  ) {
    return this.markNotificationRead.execute(notificationId, actorId);
  }
}
