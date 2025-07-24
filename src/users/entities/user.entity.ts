import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  _id: number;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'user', enum: ['user', 'admin'] })
  role: string;
}
