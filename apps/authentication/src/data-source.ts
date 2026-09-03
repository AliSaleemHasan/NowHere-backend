import { DataSource } from 'typeorm';
import { Credential } from './entities/user-credentials-entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE,
  entities: [Credential],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
