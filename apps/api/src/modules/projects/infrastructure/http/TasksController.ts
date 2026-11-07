import { Body, Controller, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AssignTaskDto } from '../../application/dto/AssignTaskDto';
import { UpdateTaskStatusDto } from '../../application/dto/UpdateTaskStatusDto';
import { AssignTaskUseCase } from '../../application/use-cases/AssignTaskUseCase';
import { UpdateTaskStatusUseCase } from '../../application/use-cases/UpdateTaskStatusUseCase';
import { AssignTaskRequest } from './dto/AssignTaskRequest';
import { UpdateTaskStatusRequest } from './dto/UpdateTaskStatusRequest';
import { ErrorResponse } from './dto/ErrorResponse';
import { TaskResponse } from './dto/TaskResponse';

@Controller('api/v1/tasks')
@ApiTags('tasks')
export class TasksController {
  constructor(
    @Inject(UpdateTaskStatusUseCase)
    private readonly updateTaskStatus: UpdateTaskStatusUseCase,
    @Inject(AssignTaskUseCase)
    private readonly assignTask: AssignTaskUseCase,
  ) {}

  @Patch(':taskId/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiOkResponse({ type: TaskResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  updateStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() request: UpdateTaskStatusRequest,
  ) {
    const input: UpdateTaskStatusDto = { taskId, status: request.status };
    return this.updateTaskStatus.execute(input);
  }

  @Patch(':taskId/assignee')
  @ApiOperation({ summary: 'Assign a task' })
  @ApiOkResponse({ type: TaskResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  assign(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() request: AssignTaskRequest,
  ) {
    const input: AssignTaskDto = { taskId, assigneeId: request.assigneeId };
    return this.assignTask.execute(input);
  }
}
