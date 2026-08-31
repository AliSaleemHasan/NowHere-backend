import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  getValidateFn,
  NatsClientModule,
  JetStreamModule,
} from 'nowhere-common';
import { AuthEnvVariables } from './utils/auth-env-variables';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    NatsClientModule.register('NATS_CLIENT'),
    JetStreamModule.forRoot(),
    TerminusModule,
    ConfigModule.forRoot({
      validate: getValidateFn(AuthEnvVariables),
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour
        limit: 10, // 10 requests per hour
      },
    ]),
    JwtModule.register({ global: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST', 'mysql'),
        port: Number(configService.get('MYSQL_PORT', 3306)),
        username: configService.get('MYSQL_USER', 'root'),
        password: configService.get('MYSQL_PASS', 'root'),
        database: configService.get('MYSQL_DATABASE', 'users'),
        entities: [],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [HealthController],
})
export class UsersAppModule {}
