import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProjectDto } from '../../application/dto/CreateProjectDto';
import { CreateTaskDto } from '../../application/dto/CreateTaskDto';
import { CreateProjectUseCase } from '../../application/use-cases/CreateProjectUseCase';
import { CreateTaskUseCase } from '../../application/use-cases/CreateTaskUseCase';
import { GetProjectTasksQuery } from '../../application/use-cases/GetProjectTasksQuery';
import { CreateProjectRequest } from './dto/CreateProjectRequest';
import { CreateTaskRequest } from './dto/CreateTaskRequest';
import { ErrorResponse } from './dto/ErrorResponse';
import { ProjectResponse } from './dto/ProjectResponse';
import { TaskResponse } from './dto/TaskResponse';

@Controller('api/v1/projects')
@ApiTags('projects')
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
  @ApiOperation({ summary: 'Create a project' })
  @ApiCreatedResponse({ type: ProjectResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
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
  @ApiOperation({ summary: 'Create a task in a project' })
  @ApiCreatedResponse({ type: TaskResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
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
  @ApiOperation({ summary: 'List tasks in a project' })
  @ApiOkResponse({ type: TaskResponse, isArray: true })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  getTasks(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.getProjectTasks.execute(projectId);
  }
}
