import * as path from 'path';
import { DataSource } from 'typeorm';
import { mysqlCliDataSourceConfig } from 'nowhere-common';
import { Credential } from './entities/user-credentials-entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

export const AppDataSource = new DataSource(
  mysqlCliDataSourceConfig({
    entities: [Credential, PasswordResetToken],
    migrationsDir: path.join(__dirname, 'migrations'),
  }),
);
