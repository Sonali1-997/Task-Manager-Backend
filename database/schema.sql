-- ============================================================================
--  Task Management System — Database Schema
--  Engine: Microsoft SQL Server 2019+ (T-SQL)
--  This file is the source of truth for the schema. TypeORM runs with
--  synchronize=false, so apply changes here (or via migrations), never by
--  letting the ORM mutate the schema.
--
--  Notes on the MySQL -> SQL Server port:
--    * AUTO_INCREMENT          -> IDENTITY(1,1)
--    * BIGINT UNSIGNED         -> BIGINT (SQL Server has no unsigned ints)
--    * ENUM(...)               -> NVARCHAR(...) + CHECK constraint
--    * VARCHAR / TEXT          -> NVARCHAR / NVARCHAR(MAX) (Unicode, ~ utf8mb4)
--    * ON UPDATE CURRENT_TIMESTAMP has no column-level equivalent; emulated
--      with an AFTER UPDATE trigger per table.
-- ============================================================================

IF DB_ID(N'tms') IS NULL
    CREATE DATABASE [tms];
GO

USE [tms];
GO

-- ===== USER MODULE =====
IF OBJECT_ID(N'dbo.tms_user', N'U') IS NULL
CREATE TABLE dbo.tms_user (
    UserNo         BIGINT          IDENTITY(1,1) NOT NULL,           -- Primary key
    [Name]         NVARCHAR(100)   NOT NULL,                         -- Full name of the user
    Email          NVARCHAR(190)   NOT NULL,                         -- Login email (unique)
    [Password]     NVARCHAR(255)   NOT NULL,                         -- BCrypt password hash
    [Role]         NVARCHAR(10)    NOT NULL CONSTRAINT DF_user_role   DEFAULT ('user'),   -- RBAC access role
    [Status]       NVARCHAR(10)    NOT NULL CONSTRAINT DF_user_status DEFAULT ('active'), -- Row lifecycle / soft delete
    CreatedBy      BIGINT          NOT NULL,                         -- UserNo of creator (0 = self-registration)
    CreateDatetime DATETIME        NOT NULL CONSTRAINT DF_user_created DEFAULT (CURRENT_TIMESTAMP), -- Row creation time
    UpdateDatetime DATETIME        NOT NULL CONSTRAINT DF_user_updated DEFAULT (CURRENT_TIMESTAMP), -- Row last update time
    CONSTRAINT PK_tms_user      PRIMARY KEY (UserNo),
    CONSTRAINT UQ_user_email    UNIQUE (Email),
    CONSTRAINT CK_user_role     CHECK ([Role]   IN ('admin','user')),
    CONSTRAINT CK_user_status   CHECK ([Status] IN ('active','inactive','deleted'))
);
GO

-- ===== PROJECT MODULE =====
IF OBJECT_ID(N'dbo.tms_project', N'U') IS NULL
CREATE TABLE dbo.tms_project (
    ProjectNo      BIGINT          IDENTITY(1,1) NOT NULL,           -- Primary key
    [Name]         NVARCHAR(150)   NOT NULL,                         -- Project name
    [Description]  NVARCHAR(MAX)   NULL,                             -- Project description
    [Status]       NVARCHAR(10)    NOT NULL CONSTRAINT DF_project_status DEFAULT ('active'), -- Row lifecycle / soft delete
    CreatedBy      BIGINT          NOT NULL,                         -- UserNo of creator / owner
    CreateDatetime DATETIME        NOT NULL CONSTRAINT DF_project_created DEFAULT (CURRENT_TIMESTAMP), -- Row creation time
    UpdateDatetime DATETIME        NOT NULL CONSTRAINT DF_project_updated DEFAULT (CURRENT_TIMESTAMP), -- Row last update time
    CONSTRAINT PK_tms_project    PRIMARY KEY (ProjectNo),
    CONSTRAINT CK_project_status CHECK ([Status] IN ('active','inactive','deleted'))
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_project_createdby' AND object_id = OBJECT_ID(N'dbo.tms_project'))
    CREATE INDEX IX_project_createdby ON dbo.tms_project (CreatedBy);
GO

-- ===== AUTH MODULE =====
IF OBJECT_ID(N'dbo.tms_token_blocklist', N'U') IS NULL
CREATE TABLE dbo.tms_token_blocklist (
    Jti            CHAR(36)        NOT NULL,                         -- JWT ID (jti claim) of an invalidated token
    ExpiresAt      DATETIME        NOT NULL,                         -- Original token expiry; row can be purged after this
    CreateDatetime DATETIME        NOT NULL CONSTRAINT DF_blocklist_created DEFAULT (CURRENT_TIMESTAMP), -- When blocklisted (logout time)
    CONSTRAINT PK_tms_token_blocklist PRIMARY KEY (Jti)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_blocklist_expires' AND object_id = OBJECT_ID(N'dbo.tms_token_blocklist'))
    CREATE INDEX IX_blocklist_expires ON dbo.tms_token_blocklist (ExpiresAt);
GO

-- ===== TASK MODULE =====
IF OBJECT_ID(N'dbo.tms_task', N'U') IS NULL
CREATE TABLE dbo.tms_task (
    TaskNo         BIGINT          IDENTITY(1,1) NOT NULL,           -- Primary key
    Title          NVARCHAR(200)   NOT NULL,                         -- Task title
    [Description]  NVARCHAR(MAX)   NULL,                             -- Task description
    TaskStatus     NVARCHAR(15)    NOT NULL CONSTRAINT DF_task_taskstatus DEFAULT ('todo'),   -- Workflow status (separate from row Status)
    Priority       NVARCHAR(10)    NOT NULL CONSTRAINT DF_task_priority   DEFAULT ('medium'), -- Task priority
    DueDate        DATE            NULL,                             -- Due date
    AssignedUserNo BIGINT          NULL,                             -- Assignee UserNo (cross-module ref by ID)
    ProjectNo      BIGINT          NOT NULL,                         -- Owning ProjectNo (cross-module ref by ID)
    [Status]       NVARCHAR(10)    NOT NULL CONSTRAINT DF_task_status DEFAULT ('active'), -- Row lifecycle / soft delete
    CreatedBy      BIGINT          NOT NULL,                         -- UserNo of creator
    CreateDatetime DATETIME        NOT NULL CONSTRAINT DF_task_created DEFAULT (CURRENT_TIMESTAMP), -- Row creation time
    UpdateDatetime DATETIME        NOT NULL CONSTRAINT DF_task_updated DEFAULT (CURRENT_TIMESTAMP), -- Row last update time
    CONSTRAINT PK_tms_task        PRIMARY KEY (TaskNo),
    CONSTRAINT CK_task_taskstatus CHECK (TaskStatus IN ('todo','in_progress','done')),
    CONSTRAINT CK_task_priority   CHECK (Priority   IN ('low','medium','high')),
    CONSTRAINT CK_task_status     CHECK ([Status]   IN ('active','inactive','deleted'))
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_task_project' AND object_id = OBJECT_ID(N'dbo.tms_task'))
    CREATE INDEX IX_task_project ON dbo.tms_task (ProjectNo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_task_assignee' AND object_id = OBJECT_ID(N'dbo.tms_task'))
    CREATE INDEX IX_task_assignee ON dbo.tms_task (AssignedUserNo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_task_status' AND object_id = OBJECT_ID(N'dbo.tms_task'))
    CREATE INDEX IX_task_status ON dbo.tms_task (TaskStatus);
GO

-- ============================================================================
--  UpdateDatetime auto-touch triggers (emulating MySQL's ON UPDATE
--  CURRENT_TIMESTAMP). TypeORM's @UpdateDateColumn also sets this on ORM
--  saves; the triggers cover raw/ad-hoc UPDATEs as well.
-- ============================================================================
GO
CREATE OR ALTER TRIGGER dbo.TR_user_touch ON dbo.tms_user AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u SET UpdateDatetime = CURRENT_TIMESTAMP
    FROM dbo.tms_user u INNER JOIN inserted i ON u.UserNo = i.UserNo;
END;
GO
CREATE OR ALTER TRIGGER dbo.TR_project_touch ON dbo.tms_project AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p SET UpdateDatetime = CURRENT_TIMESTAMP
    FROM dbo.tms_project p INNER JOIN inserted i ON p.ProjectNo = i.ProjectNo;
END;
GO
CREATE OR ALTER TRIGGER dbo.TR_task_touch ON dbo.tms_task AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t SET UpdateDatetime = CURRENT_TIMESTAMP
    FROM dbo.tms_task t INNER JOIN inserted i ON t.TaskNo = i.TaskNo;
END;
GO
