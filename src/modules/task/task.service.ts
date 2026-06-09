import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { RowStatus, TaskPriority, TaskStatus, UserRole } from '../../common/enums';
import { ProjectService } from '../project/project.service';
import { UserService } from '../user/user.service';
import { Task } from './entities/task.entity';

interface Actor {
  userNo: string;
  role: UserRole;
}

interface CreateTaskInput {
  projectNo: string;
  title: string;
  description?: string;
  taskStatus?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedUserNo?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  taskStatus?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedUserNo?: string | null;
}

/**
 * Domain service for the Task aggregate. Authorization is delegated to the
 * owning project (via ProjectService): you manage tasks in projects you own,
 * admins manage any. Cross-module references stay by ID.
 */
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  async create(input: CreateTaskInput, actor: Actor): Promise<Task> {
    // Authorizes against the project and confirms it exists/active.
    await this.projectService.getOwned(input.projectNo, actor);
    await this.assertAssigneeExists(input.assignedUserNo);

    const task = this.taskRepo.create({
      title: input.title,
      description: input.description ?? null,
      taskStatus: input.taskStatus ?? TaskStatus.TODO,
      priority: input.priority ?? TaskPriority.MEDIUM,
      dueDate: input.dueDate ?? null,
      assignedUserNo: input.assignedUserNo ?? null,
      projectNo: input.projectNo,
      status: RowStatus.ACTIVE,
      createdBy: actor.userNo,
    });
    return this.taskRepo.save(task);
  }

  /**
   * List active tasks the actor may see (tasks in their projects; admins see
   * all). Optionally filter by project and/or workflow status.
   */
  async findAll(
    actor: Actor,
    filter: { projectNo?: string; taskStatus?: TaskStatus } = {},
  ): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = { status: RowStatus.ACTIVE };

    if (filter.projectNo) {
      // Authorize the explicit project filter.
      await this.projectService.getOwned(filter.projectNo, actor);
      where.projectNo = filter.projectNo;
    } else if (actor.role !== UserRole.ADMIN) {
      // Scope to the actor's own projects.
      const projects = await this.projectService.findAll(actor);
      if (projects.length === 0) return [];
      where.projectNo = In(projects.map((p) => p.projectNo));
    }

    if (filter.taskStatus) where.taskStatus = filter.taskStatus;

    return this.taskRepo.find({ where, order: { taskNo: 'DESC' } });
  }

  /**
   * Per-project active-task counts in a single grouped query: total tasks and
   * how many are 'done'. Keyed by ProjectNo; projects with no tasks are absent.
   */
  async countByProjectIds(
    projectNos: string[],
  ): Promise<Map<string, { total: number; done: number }>> {
    const counts = new Map<string, { total: number; done: number }>();
    if (projectNos.length === 0) return counts;

    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.projectNo', 'projectNo')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN t.taskStatus = :done THEN 1 ELSE 0 END)',
        'done',
      )
      .where('t.status = :active', { active: RowStatus.ACTIVE })
      .andWhere('t.projectNo IN (:...ids)', { ids: projectNos })
      .setParameter('done', TaskStatus.DONE)
      .groupBy('t.projectNo')
      .getRawMany<{ projectNo: string; total: string; done: string }>();

    for (const r of rows) {
      counts.set(String(r.projectNo), {
        total: Number(r.total),
        done: Number(r.done),
      });
    }
    return counts;
  }

  /** Active tasks assigned to a specific user, newest first. */
  findAssignedTo(userNo: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { assignedUserNo: userNo, status: RowStatus.ACTIVE },
      order: { taskNo: 'DESC' },
    });
  }

  async update(
    taskNo: string,
    changes: UpdateTaskInput,
    actor: Actor,
  ): Promise<Task> {
    const task = await this.getAuthorizedTask(taskNo, actor);

    if (changes.title !== undefined) task.title = changes.title;
    if (changes.description !== undefined) task.description = changes.description;
    if (changes.taskStatus !== undefined) task.taskStatus = changes.taskStatus;
    if (changes.priority !== undefined) task.priority = changes.priority;
    if (changes.dueDate !== undefined) task.dueDate = changes.dueDate;
    if (changes.assignedUserNo !== undefined) {
      await this.assertAssigneeExists(changes.assignedUserNo);
      task.assignedUserNo = changes.assignedUserNo;
    }

    return this.taskRepo.save(task);
  }

  /** Soft-delete (Status -> 'deleted'). */
  async softDelete(taskNo: string, actor: Actor): Promise<void> {
    const task = await this.getAuthorizedTask(taskNo, actor);
    task.status = RowStatus.DELETED;
    await this.taskRepo.save(task);
  }

  /** Load an active task and authorize the actor via its owning project. */
  private async getAuthorizedTask(taskNo: string, actor: Actor): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { taskNo, status: RowStatus.ACTIVE },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    // Throws Forbidden/NotFound if the actor can't access the parent project.
    await this.projectService.getOwned(task.projectNo, actor);
    return task;
  }

  /** Ensure a provided assignee exists and is active. Null/undefined is fine. */
  private async assertAssigneeExists(
    assignedUserNo?: string | null,
  ): Promise<void> {
    if (!assignedUserNo) return;
    const user = await this.userService.findById(assignedUserNo);
    if (!user) {
      throw new BadRequestException('Assigned user does not exist');
    }
  }
}
