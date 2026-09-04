import { IsEmail, IsStrongPassword } from 'class-validator';
import { ROLES } from 'contracts';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'simple-enum', enum: ROLES, default: ROLES.USER })
  role: ROLES;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'int', default: 0 })
  failedLoginCount: number;

  @Column({ type: 'datetime', nullable: true })
  lockedUntil: Date | null;
}
