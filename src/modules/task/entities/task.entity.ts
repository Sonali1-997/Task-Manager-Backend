import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RowStatus, TaskPriority, TaskStatus } from '../../../common/enums';

@Entity('tms_task')
export class Task {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'TaskNo' })
  taskNo: string;

  @Column({ type: 'varchar', length: 200, name: 'Title' })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'Description' })
  description: string | null;

  @Index('IX_task_status')
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
    name: 'TaskStatus',
  })
  taskStatus: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    name: 'Priority',
  })
  priority: TaskPriority;

  @Column({ type: 'date', nullable: true, name: 'DueDate' })
  dueDate: string | null;

  @Index('IX_task_assignee')
  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'AssignedUserNo' })
  assignedUserNo: string | null;

  @Index('IX_task_project')
  @Column({ type: 'bigint', unsigned: true, name: 'ProjectNo' })
  projectNo: string;

  @Column({
    type: 'enum',
    enum: RowStatus,
    default: RowStatus.ACTIVE,
    name: 'Status',
  })
  status: RowStatus;

  @Column({ type: 'bigint', unsigned: true, name: 'CreatedBy' })
  createdBy: string;

  @CreateDateColumn({ type: 'datetime', name: 'CreateDatetime' })
  createDatetime: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'UpdateDatetime' })
  updateDatetime: Date;
}
