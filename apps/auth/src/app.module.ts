import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from './authentication/authentication.module';
import { GrpcModule } from './grpc/grpc.module';
import * as path from 'path';
@Module({
  imports: [
    GrpcModule,
    ConfigModule.forRoot({
      // validate,
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
        entities: [],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthenticationModule,
    // SeedService,
    JwtModule.register({ global: true }),
  ],
  controllers: [],
})
export class AuthModule {}
