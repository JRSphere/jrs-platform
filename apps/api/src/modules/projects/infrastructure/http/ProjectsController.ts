import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateProjectDto } from '../../application/dto/CreateProjectDto';
import { CreateTaskDto } from '../../application/dto/CreateTaskDto';
import { CreateProjectUseCase } from '../../application/use-cases/CreateProjectUseCase';
import { CreateTaskUseCase } from '../../application/use-cases/CreateTaskUseCase';
import { GetProjectTasksQuery } from '../../application/use-cases/GetProjectTasksQuery';
import { CreateProjectRequest } from './dto/CreateProjectRequest';
import { CreateTaskRequest } from './dto/CreateTaskRequest';

@Controller('api/v1/projects')
export class ProjectsController {
  constructor(
    @Inject(CreateProjectUseCase)
    private readonly createProject: CreateProjectUseCase,
    @Inject(CreateTaskUseCase)
    private readonly createTask: CreateTaskUseCase,
    @Inject(GetProjectTasksQuery)
    private readonly getProjectTasks: GetProjectTasksQuery,
  ) {}

  @Post()
  createProjectRequest(@Body() request: CreateProjectRequest) {
    // ownerId comes from the body only until the identity JWT guard exists.
    const input: CreateProjectDto = {
      name: request.name,
      ownerId: request.ownerId,
      description: request.description,
    };
    return this.createProject.execute(input);
  }

  @Post(':projectId/tasks')
  createTaskRequest(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() request: CreateTaskRequest,
  ) {
    const input: CreateTaskDto = {
      projectId,
      title: request.title,
      description: request.description,
      assigneeId: request.assigneeId,
      dueDate: request.dueDate == null ? request.dueDate : new Date(request.dueDate),
    };
    return this.createTask.execute(input);
  }

  @Get(':projectId/tasks')
  getTasks(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.getProjectTasks.execute(projectId);
  }
}
