import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RowStatus, UserRole } from '../../common/enums';
import { Project } from './entities/project.entity';

/** Identity of the caller performing an action, for ownership checks. */
interface Actor {
  userNo: string;
  role: UserRole;
}

/**
 * Domain service for the Project aggregate. All project persistence goes
 * through here; cross-module data (tasks/users) is referenced by ID only, so
 * this stays splittable into its own service later.
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(
    input: { name: string; description?: string },
    actor: Actor,
  ): Promise<Project> {
    const project = this.projectRepo.create({
      name: input.name,
      description: input.description ?? null,
      status: RowStatus.ACTIVE,
      createdBy: actor.userNo,
    });
    return this.projectRepo.save(project);
  }

  /** List active projects: admins see all, others see only their own. */
  findAll(actor: Actor): Promise<Project[]> {
    const where =
      actor.role === UserRole.ADMIN
        ? { status: RowStatus.ACTIVE }
        : { status: RowStatus.ACTIVE, createdBy: actor.userNo };
    return this.projectRepo.find({ where, order: { projectNo: 'DESC' } });
  }

  /** Fetch active projects by id (e.g. the projects a user has tasks in). */
  findByIds(projectNos: string[]): Promise<Project[]> {
    if (projectNos.length === 0) return Promise.resolve([]);
    return this.projectRepo.find({
      where: { projectNo: In(projectNos), status: RowStatus.ACTIVE },
      order: { projectNo: 'DESC' },
    });
  }

  async update(
    projectNo: string,
    changes: { name?: string; description?: string },
    actor: Actor,
  ): Promise<Project> {
    const project = await this.getOwned(projectNo, actor);
    if (changes.name !== undefined) project.name = changes.name;
    if (changes.description !== undefined) {
      project.description = changes.description;
    }
    return this.projectRepo.save(project);
  }

  /** Soft-delete (Status -> 'deleted'), preserving rows that tasks reference. */
  async softDelete(projectNo: string, actor: Actor): Promise<void> {
    const project = await this.getOwned(projectNo, actor);
    project.status = RowStatus.DELETED;
    await this.projectRepo.save(project);
  }

  /**
   * Fetch an active project, enforcing that the actor owns it (or is admin).
   * Public so dependent modules (e.g. tasks) can authorize against a project.
   */
  async getOwned(projectNo: string, actor: Actor): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { projectNo, status: RowStatus.ACTIVE },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (actor.role !== UserRole.ADMIN && project.createdBy !== actor.userNo) {
      throw new ForbiddenException('You do not own this project');
    }
    return project;
  }
}
