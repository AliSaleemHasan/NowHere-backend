import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ChangePasswordService } from './change-password.service';
import { PasswordResetService } from './password-reset.service';
import { AccountLifecycleService } from './account-lifecycle.service';
import { SmtpMailer } from './smtp-mailer';
import { AuthNatsController } from './controllers/auth.nats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { Credential } from './entities/user-credentials-entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { JwtModule } from '@nestjs/jwt';
import {
  createEnvConfigModule,
  HealthModule,
  JetStreamModule,
  mysqlTypeOrmConfig,
} from 'nowhere-common';
import { AuthenticationEnvVariables } from './utils/auth-env-variables';

@Module({
  imports: [
    createEnvConfigModule(AuthenticationEnvVariables),
    JetStreamModule.forRoot(),
    HealthModule.forTypeOrm(),
    TypeOrmModule.forFeature([Credential, PasswordResetToken]),
    JwtModule.register({ global: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        mysqlTypeOrmConfig(configService, {
          entities: [Credential, PasswordResetToken],
          migrationsDir: path.join(__dirname, 'migrations'),
          defaultDatabase: 'Users_Credentials',
        }),
    }),
  ],
  controllers: [AuthNatsController],
  providers: [
    AuthenticationService,
    ChangePasswordService,
    PasswordResetService,
    AccountLifecycleService,
    SmtpMailer,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
