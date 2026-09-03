import * as path from 'path';
import { DataSource } from 'typeorm';
import { mysqlCliDataSourceConfig } from 'nowhere-common';
import { User } from './users/entities/user.entity';

export const AppDataSource = new DataSource(
  mysqlCliDataSourceConfig({
    entities: [User],
    migrationsDir: path.join(__dirname, 'migrations'),
  }),
);
