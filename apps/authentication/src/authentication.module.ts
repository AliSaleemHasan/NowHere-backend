import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { Credential } from './entities/user-credentials-entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { authProtoOptions } from '../../../libs/proto/proto-options';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: authProtoOptions,
      },
    ]),
    TypeOrmModule.forFeature([Credential]),
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({
      // validate: getValidateFn(AuthEnvVariables),
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST'),
        port: Number(configService.get('MYSQL_PORT')),
        username: configService.get('MYSQL_USER'),
        password: configService.get('MYSQL_PASS'),
        database: configService.get('MYSQL_DATABASE'),
        entities: [Credential],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true, //TODO: handle this in production
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
