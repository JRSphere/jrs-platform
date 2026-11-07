import { Body, Controller, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { AssignTaskDto } from '../../application/dto/AssignTaskDto';
import { UpdateTaskStatusDto } from '../../application/dto/UpdateTaskStatusDto';
import { AssignTaskUseCase } from '../../application/use-cases/AssignTaskUseCase';
import { UpdateTaskStatusUseCase } from '../../application/use-cases/UpdateTaskStatusUseCase';
import { AssignTaskRequest } from './dto/AssignTaskRequest';
import { UpdateTaskStatusRequest } from './dto/UpdateTaskStatusRequest';

@Controller('api/v1/tasks')
export class TasksController {
  constructor(
    @Inject(UpdateTaskStatusUseCase)
    private readonly updateTaskStatus: UpdateTaskStatusUseCase,
    @Inject(AssignTaskUseCase)
    private readonly assignTask: AssignTaskUseCase,
  ) {}

  @Patch(':taskId/status')
  updateStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() request: UpdateTaskStatusRequest,
  ) {
    const input: UpdateTaskStatusDto = { taskId, status: request.status };
    return this.updateTaskStatus.execute(input);
  }

  @Patch(':taskId/assignee')
  assign(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() request: AssignTaskRequest,
  ) {
    const input: AssignTaskDto = { taskId, assigneeId: request.assigneeId };
    return this.assignTask.execute(input);
  }
}
