import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TokenBlocklist } from '../modules/auth/entities/token-blocklist.entity';
import { User } from '../modules/user/entities/user.entity';
import { Project } from '../modules/project/entities/project.entity';
import { Task } from '../modules/task/entities/task.entity';

/**
 * Builds TypeORM connection options from environment configuration.
 * synchronize stays off by default — the schema is owned by
 * database/schema.sql, not the ORM.
 */
export const buildTypeOrmOptions = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: config.get<number>('DB_PORT', 3306),
  username: config.get<string>('DB_USERNAME', 'root'),
  password: config.get<string>('DB_PASSWORD', 'root'),
  database: config.get<string>('DB_DATABASE', 'tms'),
  entities: [User, Project, Task, TokenBlocklist],
  synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
  logging: config.get<string>('DB_LOGGING') === 'true',
  charset: 'utf8mb4_unicode_ci',
});
