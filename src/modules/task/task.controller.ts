import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TaskStatus } from '../../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { TaskService } from './task.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks (own projects; admins see all)' })
  @ApiQuery({ name: 'projectNo', required: false })
  @ApiQuery({ name: 'taskStatus', required: false, enum: TaskStatus })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectNo') projectNo?: string,
    @Query('taskStatus') taskStatus?: TaskStatus,
  ) {
    const tasks = await this.taskService.findAll(user, { projectNo, taskStatus });
    return tasks.map((t) => this.toView(t));
  }

  @Post()
  @ApiOperation({ summary: 'Create a task in a project you own' })
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.taskService.create(dto, user);
    return this.toView(task);
  }

  @Patch(':taskNo')
  @ApiOperation({ summary: 'Update a task (owner of parent project, or admin)' })
  async update(
    @Param('taskNo') taskNo: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.taskService.update(taskNo, dto, user);
    return this.toView(task);
  }

  @Delete(':taskNo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task (owner of parent project, or admin)' })
  async remove(
    @Param('taskNo') taskNo: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.taskService.softDelete(taskNo, user);
  }

  private toView(task: Task) {
    return {
      taskNo: task.taskNo,
      title: task.title,
      description: task.description,
      taskStatus: task.taskStatus,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedUserNo: task.assignedUserNo,
      projectNo: task.projectNo,
      status: task.status,
      createdBy: task.createdBy,
      createDatetime: task.createDatetime,
      updateDatetime: task.updateDatetime,
    };
  }
}
