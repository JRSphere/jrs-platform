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
import { UpdateProjectDetailsUseCase } from './application/use-cases/UpdateProjectDetailsUseCase';
import { DeleteTaskUseCase } from './application/use-cases/DeleteTaskUseCase';
import { DeleteProjectUseCase } from './application/use-cases/DeleteProjectUseCase';
import { IEventPublisher, EVENT_PUBLISHER } from './application/ports/IEventPublisher';
import { IProjectRepository, PROJECT_REPOSITORY } from './application/ports/IProjectRepository';
import { ITaskRepository, TASK_REPOSITORY } from './application/ports/ITaskRepository';
import { PrismaProjectRepository } from './infrastructure/persistence/PrismaProjectRepository';
import { PrismaTaskRepository } from './infrastructure/persistence/PrismaTaskRepository';
import { InProcessEventPublisher } from './infrastructure/events/InProcessEventPublisher';
import { AuthenticatedGuard } from './infrastructure/http/auth/AuthenticatedGuard';
import { TaskAccess } from './application/TaskAccess';

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  controllers: [ProjectsController, TasksController],
  providers: [
    AuthenticatedGuard,
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    { provide: EVENT_PUBLISHER, useClass: InProcessEventPublisher },
    {
      provide: TaskAccess,
      useFactory: (projects: IProjectRepository, tasks: ITaskRepository) =>
        new TaskAccess(projects, tasks),
      inject: [PROJECT_REPOSITORY, TASK_REPOSITORY],
    },
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
      useFactory: (tasks: ITaskRepository, events: IEventPublisher, access: TaskAccess) =>
        new UpdateTaskStatusUseCase(tasks, events, access),
      inject: [TASK_REPOSITORY, EVENT_PUBLISHER, TaskAccess],
    },
    {
      provide: AssignTaskUseCase,
      useFactory: (tasks: ITaskRepository, events: IEventPublisher, access: TaskAccess) =>
        new AssignTaskUseCase(tasks, events, access),
      inject: [TASK_REPOSITORY, EVENT_PUBLISHER, TaskAccess],
    },
    {
      provide: UpdateTaskDetailsUseCase,
      useFactory: (tasks: ITaskRepository, access: TaskAccess) =>
        new UpdateTaskDetailsUseCase(tasks, access),
      inject: [TASK_REPOSITORY, TaskAccess],
    },
    {
      provide: UpdateProjectDetailsUseCase,
      useFactory: (projects: IProjectRepository) => new UpdateProjectDetailsUseCase(projects),
      inject: [PROJECT_REPOSITORY],
    },
    {
      provide: DeleteTaskUseCase,
      useFactory: (tasks: ITaskRepository, access: TaskAccess) =>
        new DeleteTaskUseCase(tasks, access),
      inject: [TASK_REPOSITORY, TaskAccess],
    },
    {
      provide: DeleteProjectUseCase,
      useFactory: (projects: IProjectRepository) => new DeleteProjectUseCase(projects),
      inject: [PROJECT_REPOSITORY],
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
    UpdateProjectDetailsUseCase,
    DeleteTaskUseCase,
    DeleteProjectUseCase,
  ],
})
export class ProjectsModule {}
