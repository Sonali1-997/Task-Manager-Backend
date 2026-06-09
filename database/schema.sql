-- ============================================================================
--  Task Management System — Database Schema
--  Engine: MySQL 8.x (InnoDB, utf8mb4)
--  This file is the source of truth for the schema. TypeORM runs with
--  synchronize=false, so apply changes here (or via migrations), never by
--  letting the ORM mutate the schema.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tms`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `tms`;

-- ===== USER MODULE =====
CREATE TABLE `tms_user` (
  `UserNo`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT       COMMENT 'Primary key',
  `Name`           VARCHAR(100)    NOT NULL                      COMMENT 'Full name of the user',
  `Email`          VARCHAR(190)    NOT NULL                      COMMENT 'Login email (unique)',
  `Password`       VARCHAR(255)    NOT NULL                      COMMENT 'BCrypt password hash',
  `Role`           ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT 'RBAC access role',
  `Status`         ENUM('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT 'Row lifecycle / soft delete',
  `CreatedBy`      BIGINT UNSIGNED NOT NULL                      COMMENT 'UserNo of creator (0 = self-registration)',
  `CreateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT 'Row creation time',
  `UpdateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Row last update time',
  PRIMARY KEY (`UserNo`),
  UNIQUE KEY `UQ_user_email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Application users and their roles';

-- ===== PROJECT MODULE =====
CREATE TABLE `tms_project` (
  `ProjectNo`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT       COMMENT 'Primary key',
  `Name`           VARCHAR(150)    NOT NULL                      COMMENT 'Project name',
  `Description`    TEXT            NULL                          COMMENT 'Project description',
  `Status`         ENUM('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT 'Row lifecycle / soft delete',
  `CreatedBy`      BIGINT UNSIGNED NOT NULL                      COMMENT 'UserNo of creator / owner',
  `CreateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT 'Row creation time',
  `UpdateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Row last update time',
  PRIMARY KEY (`ProjectNo`),
  KEY `IX_project_createdby` (`CreatedBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Projects that group tasks';

-- ===== AUTH MODULE =====
CREATE TABLE `tms_token_blocklist` (
  `Jti`            CHAR(36)        NOT NULL                      COMMENT 'JWT ID (jti claim) of an invalidated token',
  `ExpiresAt`      DATETIME        NOT NULL                      COMMENT 'Original token expiry; row can be purged after this',
  `CreateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT 'When the token was blocklisted (logout time)',
  PRIMARY KEY (`Jti`),
  KEY `IX_blocklist_expires` (`ExpiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Revoked JWTs (logout), kept until natural expiry';

-- ===== TASK MODULE =====
CREATE TABLE `tms_task` (
  `TaskNo`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT       COMMENT 'Primary key',
  `Title`          VARCHAR(200)    NOT NULL                      COMMENT 'Task title',
  `Description`    TEXT            NULL                          COMMENT 'Task description',
  `TaskStatus`     ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo' COMMENT 'Workflow status (separate from row Status)',
  `Priority`       ENUM('low','medium','high') NOT NULL DEFAULT 'medium' COMMENT 'Task priority',
  `DueDate`        DATE            NULL                          COMMENT 'Due date',
  `AssignedUserNo` BIGINT UNSIGNED NULL                          COMMENT 'Assignee UserNo (cross-module ref by ID)',
  `ProjectNo`      BIGINT UNSIGNED NOT NULL                      COMMENT 'Owning ProjectNo (cross-module ref by ID)',
  `Status`         ENUM('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT 'Row lifecycle / soft delete',
  `CreatedBy`      BIGINT UNSIGNED NOT NULL                      COMMENT 'UserNo of creator',
  `CreateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT 'Row creation time',
  `UpdateDatetime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Row last update time',
  PRIMARY KEY (`TaskNo`),
  KEY `IX_task_project` (`ProjectNo`),
  KEY `IX_task_assignee` (`AssignedUserNo`),
  KEY `IX_task_status` (`TaskStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tasks within projects';
