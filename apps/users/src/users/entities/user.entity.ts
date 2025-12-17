import { IsEmail, IsStrongPassword } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Roles {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  Id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: true })
  bio: string;


  @Column({ nullable: true, type: 'text' })
  image: string;
}


