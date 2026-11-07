import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../../infrastructure/prisma/PrismaModule';
import { AssignTaskUseCase } from './application/use-cases/AssignTaskUseCase';
import { CreateProjectUseCase } from './application/use-cases/CreateProjectUseCase';
import { CreateTaskUseCase } from './application/use-cases/CreateTaskUseCase';
import { GetProjectTasksQuery } from './application/use-cases/GetProjectTasksQuery';
import { UpdateTaskStatusUseCase } from './application/use-cases/UpdateTaskStatusUseCase';
import { IEventPublisher, EVENT_PUBLISHER } from './application/ports/IEventPublisher';
import { IProjectRepository, PROJECT_REPOSITORY } from './application/ports/IProjectRepository';
import { ITaskRepository, TASK_REPOSITORY } from './application/ports/ITaskRepository';
import { PrismaProjectRepository } from './infrastructure/persistence/PrismaProjectRepository';
import { PrismaTaskRepository } from './infrastructure/persistence/PrismaTaskRepository';
import { InProcessEventPublisher } from './infrastructure/events/InProcessEventPublisher';

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  providers: [
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    { provide: EVENT_PUBLISHER, useClass: InProcessEventPublisher },
    {
      provide: CreateProjectUseCase,
      useFactory: (projects: IProjectRepository) => new CreateProjectUseCase(projects),
      inject: [PROJECT_REPOSITORY],
    },
    {
      provide: CreateTaskUseCase,
      useFactory: (
        projects: IProjectRepository,
        tasks: ITaskRepository,
        events: IEventPublisher,
      ) => new CreateTaskUseCase(projects, tasks, events),
      inject: [PROJECT_REPOSITORY, TASK_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: GetProjectTasksQuery,
      useFactory: (projects: IProjectRepository, tasks: ITaskRepository) =>
        new GetProjectTasksQuery(projects, tasks),
      inject: [PROJECT_REPOSITORY, TASK_REPOSITORY],
    },
    {
      provide: UpdateTaskStatusUseCase,
      useFactory: (tasks: ITaskRepository, events: IEventPublisher) =>
        new UpdateTaskStatusUseCase(tasks, events),
      inject: [TASK_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: AssignTaskUseCase,
      useFactory: (tasks: ITaskRepository, events: IEventPublisher) =>
        new AssignTaskUseCase(tasks, events),
      inject: [TASK_REPOSITORY, EVENT_PUBLISHER],
    },
  ],
  exports: [
    CreateProjectUseCase,
    CreateTaskUseCase,
    GetProjectTasksQuery,
    UpdateTaskStatusUseCase,
    AssignTaskUseCase,
  ],
})
export class ProjectsModule {}
