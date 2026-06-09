import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { TaskService } from '../task/task.service';
import { UserService } from '../user/user.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectService } from './project.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List projects (own; admins see all)' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const projects = await this.projectService.findAll(user);
    const projectNos = projects.map((p) => p.projectNo);

    // Resolve owner names and per-project task counts, each in one query.
    const owners = await this.userService.findByIds([
      ...new Set(projects.map((p) => p.createdBy)),
    ]);
    const nameById = new Map(owners.map((o) => [o.userNo, o.name]));
    const counts = await this.taskService.countByProjectIds(projectNos);

    return projects.map((p) => {
      const c = counts.get(p.projectNo) ?? { total: 0, done: 0 };
      const progress = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
      return {
        ...this.toView(p),
        ownerName: nameById.get(p.createdBy) ?? null,
        totalTasks: c.total,
        doneTasks: c.done,
        progress, // percent of tasks done (0–100)
      };
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectService.create(dto, user);
    return this.toView(project);
  }

  @Patch(':projectNo')
  @ApiOperation({ summary: 'Update a project (owner or admin)' })
  async update(
    @Param('projectNo') projectNo: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectService.update(projectNo, dto, user);
    return this.toView(project);
  }

  @Delete(':projectNo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project (owner or admin, soft delete)' })
  async remove(
    @Param('projectNo') projectNo: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.projectService.softDelete(projectNo, user);
  }

  private toView(project: Project) {
    return {
      projectNo: project.projectNo,
      name: project.name,
      description: project.description,
      status: project.status,
      createdBy: project.createdBy,
      createDatetime: project.createDatetime,
      updateDatetime: project.updateDatetime,
    };
  }
}
