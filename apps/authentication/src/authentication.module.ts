import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthNatsController } from './controllers/auth.nats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { Credential } from './entities/user-credentials-entity';
import { JwtModule } from '@nestjs/jwt';
import { getValidateFn, JetStreamModule } from 'nowhere-common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { AuthenticationEnvVariables } from './utils/auth-env-variables';

@Module({
  imports: [
    JetStreamModule.forRoot(),
    TerminusModule,
    TypeOrmModule.forFeature([Credential]),
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
      validate: getValidateFn(AuthenticationEnvVariables),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST', 'mysql'),
        port: Number(configService.get('MYSQL_PORT', 3306)),
        username: configService.get('MYSQL_USER', 'root'),
        password: configService.get('MYSQL_PASS', 'root'),
        database: configService.get('MYSQL_DATABASE', 'Users_Credentials'),
        entities: [Credential],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: configService.get('TYPEORM_SYNC') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthNatsController, HealthController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
