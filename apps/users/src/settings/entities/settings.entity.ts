import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Settings {
  // for settings we need a list of tags for each user  ( so heare we need userID)

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Proper OneToOne relation with User
  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  user: User;

  // now for the distination to show the snaps in meters
  @Column({ type: 'integer', default: 10000 })
  maxDistance: number;

  // the minimum distance for sharing more than one post
  @Column({ type: 'integer', default: 1000 })
  newSnapDistance: number;

  @Column({ type: 'integer', default: 1 })
  snapDisappearTime: number;
}
