import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  createEnvConfigModule,
  HealthModule,
  JetStreamModule,
  mysqlTypeOrmConfig,
  NatsClientModule,
} from 'nowhere-common';
import { UsersEnvVariables } from './utils/users-env-variables';

@Module({
  imports: [
    createEnvConfigModule(UsersEnvVariables),
    NatsClientModule.register(),
    JetStreamModule.forRoot(),
    HealthModule.forTypeOrm(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        mysqlTypeOrmConfig(configService, {
          migrationsDir: path.join(__dirname, 'migrations'),
          defaultDatabase: 'Users_Info',
        }),
    }),
    UsersModule,
  ],
})
export class UsersAppModule {}
