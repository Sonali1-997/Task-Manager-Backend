import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RowStatus } from '../../../common/enums';

@Entity('tms_project')
export class Project {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'ProjectNo' })
  projectNo: string;

  @Column({ type: 'nvarchar', length: 150, name: 'Name' })
  name: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'Description' })
  description: string | null;

  @Column({
    type: 'simple-enum',
    enum: RowStatus,
    default: RowStatus.ACTIVE,
    name: 'Status',
  })
  status: RowStatus;

  @Index('IX_project_createdby')
  @Column({ type: 'bigint', name: 'CreatedBy' })
  createdBy: string;

  @CreateDateColumn({ type: 'datetime', name: 'CreateDatetime' })
  createDatetime: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'UpdateDatetime' })
  updateDatetime: Date;
}
