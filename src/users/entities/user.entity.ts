import { IsEmail, IsStrongPassword } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Roles {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ nullable: false })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: string;

  @Column({ nullable: true })
  image: string;
}
