import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProjectDto } from '../../application/dto/CreateProjectDto';
import { CreateTaskDto } from '../../application/dto/CreateTaskDto';
import { CreateProjectUseCase } from '../../application/use-cases/CreateProjectUseCase';
import { CreateTaskUseCase } from '../../application/use-cases/CreateTaskUseCase';
import { GetProjectTasksQuery } from '../../application/use-cases/GetProjectTasksQuery';
import { ListProjectsQuery } from '../../application/use-cases/ListProjectsQuery';
import { UpdateProjectDetailsUseCase } from '../../application/use-cases/UpdateProjectDetailsUseCase';
import { UpdateProjectDetailsDto } from '../../application/dto/UpdateProjectDetailsDto';
import { DeleteProjectUseCase } from '../../application/use-cases/DeleteProjectUseCase';
import { CreateProjectRequest } from './dto/CreateProjectRequest';
import { CreateTaskRequest } from './dto/CreateTaskRequest';
import { ErrorResponse } from './dto/ErrorResponse';
import { ProjectResponse } from './dto/ProjectResponse';
import { TaskResponse } from './dto/TaskResponse';
import { PageQuery } from './dto/PageQuery';
import { TaskPageResponse } from './dto/TaskPageResponse';
import { ProjectPageResponse } from './dto/ProjectPageResponse';
import { UpdateProjectDetailsRequest } from './dto/UpdateProjectDetailsRequest';

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
    @Inject(ListProjectsQuery)
    private readonly listProjects: ListProjectsQuery,
    @Inject(UpdateProjectDetailsUseCase)
    private readonly updateProjectDetails: UpdateProjectDetailsUseCase,
    @Inject(DeleteProjectUseCase)
    private readonly deleteProject: DeleteProjectUseCase,
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

  @Get()
  @ApiOperation({ summary: 'List projects' })
  @ApiOkResponse({ type: ProjectPageResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  list(
    @Query() query: PageQuery,
  ) {
    return this.listProjects.execute({
      page: query.page,
      limit: query.limit,
    });
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update project details' })
  @ApiOkResponse({ type: ProjectResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  updateDetails(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() request: UpdateProjectDetailsRequest,
  ) {
    const input: UpdateProjectDetailsDto = {
      projectId,
      ...(request.name !== undefined && { name: request.name }),
      ...(request.description !== undefined && { description: request.description }),
    };
    return this.updateProjectDetails.execute(input);
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async delete(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<void> {
    await this.deleteProject.execute(projectId);
  }

  @Get(':projectId/tasks')
  @ApiOperation({ summary: 'List tasks in a project' })
  @ApiOkResponse({ type: TaskPageResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  getTasks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: PageQuery,
  ) {
    return this.getProjectTasks.execute(projectId, {
      page: query.page,
      limit: query.limit,
    });
  }
}
