import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Admin-only: create a user (role selectable). */
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() current: AuthenticatedUser,
  ) {
    const user = await this.userService.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      createdBy: current.userNo,
    });
    return this.toView(user);
  }

  /** Admin-only: list all users. */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  async findAll() {
    const users = await this.userService.findAll();
    return users.map((u) => this.toView(u));
  }

  /** Admin-only: change a user's role. */
  @Patch(':userNo/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user role (admin only)' })
  async updateRole(
    @Param('userNo') userNo: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const user = await this.userService.updateRole(userNo, dto.role);
    return this.toView(user);
  }

  /** Admin-only: soft-delete a user. Admins cannot delete their own account. */
  @Delete(':userNo')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (admin only, soft delete)' })
  async remove(
    @Param('userNo') userNo: string,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<void> {
    if (userNo === current.userNo) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    await this.userService.softDelete(userNo);
  }

  /** Public-safe projection of a user (never exposes the password hash). */
  private toView(user: User) {
    return {
      userNo: user.userNo,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createDatetime: user.createDatetime,
    };
  }
}
