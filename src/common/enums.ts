/** Row lifecycle status shared by every table (soft-delete aware). */
export enum RowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

/** RBAC role on tms_user. */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/** Workflow status on tms_task (distinct from the row Status column). */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

/** Priority on tms_task. */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
