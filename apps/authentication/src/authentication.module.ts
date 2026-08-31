import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthNatsController } from './controllers/auth.nats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { Credential } from './entities/user-credentials-entity';
import { JwtModule } from '@nestjs/jwt';
import { JetStreamModule } from 'nowhere-common';

@Module({
  imports: [
    JetStreamModule.forRoot(),
    TypeOrmModule.forFeature([Credential]),
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST', 'mysql'),
        port: Number(configService.get('MYSQL_PORT', 3306)),
        username: configService.get('MYSQL_USER', 'root'),
        password: configService.get('MYSQL_PASS', 'root'),
        database: configService.get('MYSQL_DATABASE', 'users'),
        entities: [Credential],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthNatsController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
