import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) + 1,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE,
  entities: [User],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
});
