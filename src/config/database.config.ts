import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TokenBlocklist } from '../modules/auth/entities/token-blocklist.entity';
import { User } from '../modules/user/entities/user.entity';
import { Project } from '../modules/project/entities/project.entity';
import { Task } from '../modules/task/entities/task.entity';

/** Reads a required env var, failing fast if it is missing/empty. */
const required = (config: ConfigService, key: string): string => {
  const value = config.get<string>(key);
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Builds TypeORM connection options from environment configuration.
 * Connection credentials are sourced strictly from the .env file (no
 * hardcoded fallbacks) and the app refuses to start if any are missing.
 * synchronize stays off by default — the schema is owned by
 * database/schema.sql, not the ORM.
 */
export const buildTypeOrmOptions = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: required(config, 'DB_HOST'),
  port: Number(required(config, 'DB_PORT')),
  username: required(config, 'DB_USERNAME'),
  password: required(config, 'DB_PASSWORD'),
  database: required(config, 'DB_DATABASE'),
  entities: [User, Project, Task, TokenBlocklist],
  synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
  logging: config.get<string>('DB_LOGGING') === 'true',
  options: {
    // TLS: enabled by default in the mssql driver. For local/dev SQL Server
    // without a trusted cert, set DB_TRUST_SERVER_CERT=true.
    encrypt: config.get<string>('DB_ENCRYPT', 'true') === 'true',
    trustServerCertificate:
      config.get<string>('DB_TRUST_SERVER_CERT', 'true') === 'true',
  },
});
