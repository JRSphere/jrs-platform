import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './infrastructure/http/auth/JwtAuthGuard';
import { DomainExceptionFilter } from './infrastructure/http/DomainExceptionFilter';
import { HttpExceptionFilter } from './infrastructure/http/HttpExceptionFilter';
import { CatchAllExceptionFilter } from './infrastructure/http/CatchAllExceptionFilter';
import { ProjectsModule } from './modules/projects/ProjectsModule';
import { NotificationsModule } from './modules/notifications/NotificationsModule';
import { IdentityModule } from './modules/identity/IdentityModule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ProjectsModule,
    NotificationsModule,
    IdentityModule,
    ThrottlerModule.forRoot([
      {
        limit: 100,
        ttl: 60_000,
        skipIf: () => process.env.NODE_ENV === 'test',
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Register the catch-all first so specific filters take precedence.
    { provide: APP_FILTER, useClass: CatchAllExceptionFilter },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}