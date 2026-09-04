import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'snap_bookmark' })
export class SnapBookmark {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  userId: string;

  @PrimaryColumn({ type: 'varchar', length: 24 })
  snapId: string;

  @CreateDateColumn()
  createdAt: Date;
}
