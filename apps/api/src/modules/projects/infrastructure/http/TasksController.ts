import { Body, Controller, Delete, HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AssignTaskDto } from '../../application/dto/AssignTaskDto';
import { UpdateTaskStatusDto } from '../../application/dto/UpdateTaskStatusDto';
import { UpdateTaskDetailsDto } from '../../application/dto/UpdateTaskDetailsDto';
import { AssignTaskUseCase } from '../../application/use-cases/AssignTaskUseCase';
import { UpdateTaskDetailsUseCase } from '../../application/use-cases/UpdateTaskDetailsUseCase';
import { UpdateTaskStatusUseCase } from '../../application/use-cases/UpdateTaskStatusUseCase';
import { DeleteTaskUseCase } from '../../application/use-cases/DeleteTaskUseCase';
import { AssignTaskRequest } from './dto/AssignTaskRequest';
import { UpdateTaskDetailsRequest } from './dto/UpdateTaskDetailsRequest';
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
    @Inject(UpdateTaskDetailsUseCase)
    private readonly updateTaskDetails: UpdateTaskDetailsUseCase,
    @Inject(DeleteTaskUseCase)
    private readonly deleteTask: DeleteTaskUseCase,
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

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update task details' })
  @ApiOkResponse({ type: TaskResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  updateDetails(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() request: UpdateTaskDetailsRequest,
  ) {
    const input: UpdateTaskDetailsDto = {
      taskId,
      ...(request.title !== undefined && { title: request.title }),
      ...(request.description !== undefined && { description: request.description }),
      ...(request.dueDate !== undefined && {
        dueDate: request.dueDate === null ? null : new Date(request.dueDate),
      }),
    };
    return this.updateTaskDetails.execute(input);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async delete(
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<void> {
    await this.deleteTask.execute(taskId);
  }
}
