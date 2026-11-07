import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../../infrastructure/prisma/PrismaModule';
import { ProjectsController } from './infrastructure/http/ProjectsController';
import { TasksController } from './infrastructure/http/TasksController';
import { AssignTaskUseCase } from './application/use-cases/AssignTaskUseCase';
import { CreateProjectUseCase } from './application/use-cases/CreateProjectUseCase';
import { CreateTaskUseCase } from './application/use-cases/CreateTaskUseCase';
import { GetProjectTasksQuery } from './application/use-cases/GetProjectTasksQuery';
import { ListProjectsQuery } from './application/use-cases/ListProjectsQuery';
import { UpdateTaskStatusUseCase } from './application/use-cases/UpdateTaskStatusUseCase';
import { UpdateTaskDetailsUseCase } from './application/use-cases/UpdateTaskDetailsUseCase';
import { IEventPublisher, EVENT_PUBLISHER } from './application/ports/IEventPublisher';
import { IProjectRepository, PROJECT_REPOSITORY } from './application/ports/IProjectRepository';
import { ITaskRepository, TASK_REPOSITORY } from './application/ports/ITaskRepository';
import { PrismaProjectRepository } from './infrastructure/persistence/PrismaProjectRepository';
import { PrismaTaskRepository } from './infrastructure/persistence/PrismaTaskRepository';
import { InProcessEventPublisher } from './infrastructure/events/InProcessEventPublisher';

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  controllers: [ProjectsController, TasksController],
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
      provide: ListProjectsQuery,
      useFactory: (projects: IProjectRepository) => new ListProjectsQuery(projects),
      inject: [PROJECT_REPOSITORY],
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
    {
      provide: UpdateTaskDetailsUseCase,
      useFactory: (tasks: ITaskRepository) => new UpdateTaskDetailsUseCase(tasks),
      inject: [TASK_REPOSITORY],
    },
  ],
  exports: [
    CreateProjectUseCase,
    CreateTaskUseCase,
    GetProjectTasksQuery,
    ListProjectsQuery,
    UpdateTaskStatusUseCase,
    AssignTaskUseCase,
    UpdateTaskDetailsUseCase,
  ],
})
export class ProjectsModule {}
