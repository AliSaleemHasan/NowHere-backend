import * as path from 'path';
import { DataSource } from 'typeorm';
import { mysqlCliDataSourceConfig } from 'nowhere-common';
import { User } from './users/entities/user.entity';
import { SnapBookmark } from './users/entities/snap-bookmark.entity';
import { SnapReport } from './users/entities/snap-report.entity';

export const AppDataSource = new DataSource(
  mysqlCliDataSourceConfig({
    entities: [User, SnapBookmark, SnapReport],
    migrationsDir: path.join(__dirname, 'migrations'),
  }),
);
