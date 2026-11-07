import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './infrastructure/http/DomainExceptionFilter';
import { ProjectsModule } from './modules/projects/ProjectsModule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ProjectsModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}