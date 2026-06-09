import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Project } from '../project/entities/project.entity';
import { ProjectService } from '../project/project.service';
import { Task } from '../task/entities/task.entity';
import { TaskService } from '../task/task.service';
import { UpdateProfileDto } from '../user/dto/update-profile.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

/**
 * Personal ("me") views for the authenticated user: their assigned work,
 * independent of project ownership. Read-only aggregation over the task and
 * project domain services.
 */
@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  @Patch('profile')
  @ApiOperation({ summary: 'Update my profile (name, email, password)' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.userService.updateProfile(user.userNo, dto);
    return this.toUserView(updated);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Tasks assigned to me' })
  async myTasks(@CurrentUser() user: AuthenticatedUser) {
    const tasks = await this.taskService.findAssignedTo(user.userNo);
    return tasks.map((t) => this.toTaskView(t));
  }

  @Get('projects')
  @ApiOperation({ summary: 'Projects I have tasks assigned in' })
  async myProjects(@CurrentUser() user: AuthenticatedUser) {
    const tasks = await this.taskService.findAssignedTo(user.userNo);
    const projectNos = [...new Set(tasks.map((t) => t.projectNo))];
    const projects = await this.projectService.findByIds(projectNos);

    // Resolve owner names and per-project progress, each in one query.
    const owners = await this.userService.findByIds([
      ...new Set(projects.map((p) => p.createdBy)),
    ]);
    const nameById = new Map(owners.map((o) => [o.userNo, o.name]));
    const counts = await this.taskService.countByProjectIds(
      projects.map((p) => p.projectNo),
    );

    return projects.map((p) => {
      const c = counts.get(p.projectNo) ?? { total: 0, done: 0 };
      const progress = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
      return {
        ...this.toProjectView(p),
        ownerName: nameById.get(p.createdBy) ?? null,
        totalTasks: c.total,
        doneTasks: c.done,
        progress, // percent of tasks done (0–100)
      };
    });
  }

  private toUserView(u: User) {
    return {
      userNo: u.userNo,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      updateDatetime: u.updateDatetime,
    };
  }

  private toTaskView(task: Task) {
    return {
      taskNo: task.taskNo,
      title: task.title,
      description: task.description,
      taskStatus: task.taskStatus,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedUserNo: task.assignedUserNo,
      projectNo: task.projectNo,
      createDatetime: task.createDatetime,
      updateDatetime: task.updateDatetime,
    };
  }

  private toProjectView(project: Project) {
    return {
      projectNo: project.projectNo,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      createDatetime: project.createDatetime,
      updateDatetime: project.updateDatetime,
    };
  }
}
