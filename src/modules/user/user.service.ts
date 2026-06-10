import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { RowStatus, UserRole } from '../../common/enums';
import { User } from './entities/user.entity';

const BCRYPT_ROUNDS = 10;

/**
 * Domain service for the User aggregate. All user persistence goes through
 * here — no other module touches the User repository directly. This is the
 * seam along which the module can later be split into its own microservice:
 * the public methods below become the  service contract (message patterns /
 * gRPC methods) and callers depend on this interface, not the repository.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Create a user from a plaintext password: rejects duplicate emails and
   * hashes the password. Single entry point for both self-registration
   * (createdBy = '0') and admin creation (createdBy = admin's UserNo, with
   * an explicit role).
   */
  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    createdBy?: string;
  }): Promise<User> {
    if (await this.existsByEmail(input.email)) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role ?? UserRole.USER,
      status: RowStatus.ACTIVE,
      // 0 = self-registration (no creator), per schema convention.
      createdBy: input.createdBy ?? '0',
    });
    return this.userRepo.save(user);
  }

  /** Look up an active user by email (used for login). */
  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email, status: RowStatus.ACTIVE },
    });
  }

  /** Look up an active user by id (used for token validation / profile). */
  findById(userNo: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { userNo, status: RowStatus.ACTIVE },
    });
  }

  /** True if an active user already exists with this email. */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepo.count({
      where: { email, status: RowStatus.ACTIVE },
    });
    return count > 0;
  }

  /**
   * Fetch users by id regardless of status (so owner names still resolve even
   * if an account was later deactivated). Returns whatever exists.
   */
  findByIds(userNos: string[]): Promise<User[]> {
    if (userNos.length === 0) return Promise.resolve([]);
    return this.userRepo.find({ where: { userNo: In(userNos) } });
  }

  /** List all active users, newest first. */
  findAll(): Promise<User[]> {
    return this.userRepo.find({
      where: { status: RowStatus.ACTIVE },
      order: { userNo: 'DESC' },
    });
  }

  /**
   * Update the user's own profile: name, email, and/or password. Changing the
   * password requires the current password. Email must stay unique.
   */
  async updateProfile(
    userNo: string,
    input: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userNo);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (input.name !== undefined) user.name = input.name;

    if (input.email !== undefined && input.email !== user.email) {
      if (await this.existsByEmail(input.email)) {
        throw new ConflictException('Email is already registered');
      }
      user.email = input.email;
    }

    if (input.newPassword !== undefined) {
      const ok =
        !!input.currentPassword &&
        (await bcrypt.compare(input.currentPassword, user.password));
      if (!ok) {
        throw new BadRequestException('Current password is incorrect');
      }
      user.password = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    }

    return this.userRepo.save(user);
  }

  /** Change a user's RBAC role. Throws if the user does not exist / is inactive. */
  async updateRole(userNo: string, role: UserRole): Promise<User> {
    const user = await this.findById(userNo);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.userRepo.save(user);
  }

  /**
   * Soft-delete a user (Status -> 'deleted'), per schema convention. The row
   * is retained so historical references (tasks/projects.CreatedBy) stay valid.
   * Throws if the user does not exist / is already inactive.
   */
  async softDelete(userNo: string): Promise<void> {
    const user = await this.findById(userNo);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = RowStatus.DELETED;
    await this.userRepo.save(user);
  }
}
