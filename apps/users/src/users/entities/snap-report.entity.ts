import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'snap_report' })
export class SnapReport {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  userId: string;

  @PrimaryColumn({ type: 'varchar', length: 24 })
  snapId: string;

  @Column({ type: 'varchar', length: 32 })
  reason: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  details?: string;

  @CreateDateColumn()
  createdAt: Date;
}
