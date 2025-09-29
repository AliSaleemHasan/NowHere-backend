import { Entity, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'snap_seen' })
@Index('IDX_user_seen_at', ['userID', 'seenAt'])
export class SnapSeen {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  userID!: string;

  @PrimaryColumn({ type: 'varchar', length: 24 })
  snapID!: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  seenAt!: Date;
}
