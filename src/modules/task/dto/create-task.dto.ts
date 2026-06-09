import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../common/enums';

export class CreateTaskDto {
  @ApiProperty({ example: '1', description: 'Owning ProjectNo' })
  @IsString()
  @IsNotEmpty()
  projectNo: string;

  @ApiProperty({ example: 'Design the landing page', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Hero section + CTA', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskStatus, required: false, example: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  taskStatus?: TaskStatus;

  @ApiProperty({
    enum: TaskPriority,
    required: false,
    example: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ example: '2026-07-01', required: false, description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '2', required: false, description: 'Assignee UserNo' })
  @IsOptional()
  @IsString()
  assignedUserNo?: string;
}
