import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from '../../../application/dto/TaskResponseDto';
import { TaskStatus } from '../../../domain/value-objects/TaskStatus';

export class TaskResponse implements TaskResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  projectId!: string;

  @ApiProperty({ type: String, maxLength: 255 })
  title!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  assigneeId!: string | null;

  @ApiProperty({ enum: TaskStatus, enumName: 'TaskStatus' })
  status!: TaskStatus;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dueDate!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
