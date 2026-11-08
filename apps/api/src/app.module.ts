import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DomainExceptionFilter } from './infrastructure/http/DomainExceptionFilter';
import { ProjectsModule } from './modules/projects/ProjectsModule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ProjectsModule,
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
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}