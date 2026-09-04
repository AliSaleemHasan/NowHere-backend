import { Entity, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'snap_seen' })
@Index('IDX_user_seen_at', ['userId', 'seenAt'])
export class SnapSeen {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  userId!: string;

  @PrimaryColumn({ type: 'varchar', length: 24 })
  snapId!: string;

  @CreateDateColumn()
  seenAt!: Date;
}
