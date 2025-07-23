import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnapsModule } from './snaps/snaps.module';
import configuration from 'scripts/config/configuration';
import { validate } from '../validation/env-validation';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    SnapsModule,
    ConfigModule.forRoot({
      validate,
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
      load: [configuration],
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo_uri', { infer: true }),
      }),
      inject: [ConfigService],
    }),
    SnapsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
