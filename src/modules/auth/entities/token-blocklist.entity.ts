import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** A revoked JWT, kept until its natural expiry so it can be rejected meanwhile. */
@Entity('tms_token_blocklist')
export class TokenBlocklist {
  @PrimaryColumn({ type: 'char', length: 36, name: 'Jti' })
  jti: string;

  @Index('IX_blocklist_expires')
  @Column({ type: 'datetime', name: 'ExpiresAt' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'datetime', name: 'CreateDatetime' })
  createDatetime: Date;
}
