import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RowStatus, UserRole } from '../../../common/enums';

@Entity('tms_user')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'UserNo' })
  userNo: string;

  @Column({ type: 'varchar', length: 100, name: 'Name' })
  name: string;

  @Index('UQ_user_email', { unique: true })
  @Column({ type: 'varchar', length: 190, name: 'Email' })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'Password' })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER, name: 'Role' })
  role: UserRole;

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
