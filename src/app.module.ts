import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnapsModule } from './snaps/snaps.module';
import configuration from 'scripts/config/configuration';
import { validate } from '../validation/env-validation';
@Module({
  imports: [
    SnapsModule,
    ConfigModule.forRoot({
      validate,
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
      load: [configuration],
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
