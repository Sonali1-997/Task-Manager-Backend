import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../common/enums';

/** All fields optional — only the provided ones are changed. */
export class UpdateTaskDto {
  @ApiProperty({ example: 'Design the landing page', maxLength: 200, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ example: 'Updated details', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  taskStatus?: TaskStatus;

  @ApiProperty({ enum: TaskPriority, required: false })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ example: '2026-07-01', required: false, description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '2', required: false, description: 'Assignee UserNo (null to unassign)' })
  @IsOptional()
  @IsString()
  assignedUserNo?: string | null;
}
