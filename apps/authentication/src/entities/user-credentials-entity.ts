import { IsEmail, IsStrongPassword } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Roles {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  Id: string;

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

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-enum', enum: Roles, default: Roles.USER })
  role: string;

  @Column({ type: 'date', nullable: true })
  lastLoginAt: Date;
}
