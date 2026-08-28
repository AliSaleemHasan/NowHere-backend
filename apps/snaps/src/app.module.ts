import { Module } from '@nestjs/common';
import { SnapsModule } from './snaps/snaps.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  configuration,
  getValidateFn,
  NatsClientModule,
} from 'nowhere-common';
import { SnapsEnvVariables } from './utils/snaps-env-variables';
import { SeedModule } from './seed/seed.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    NatsClientModule.register('NATS_CLIENT'),
    TerminusModule,
    ConfigModule.forRoot({
      validate: getValidateFn(SnapsEnvVariables),
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          `mongodb://${configService.get<string>('MONGO_ROOT_USER', 'root')}:${configService.get<string>('MONGO_ROOT_PASS', 'root')}@${configService.get<string>('MONGO_HOST', 'mongodb')}:${configService.get<number>('MONGO_PORT', 27017)}/${configService.get<string>('MONGO_DATABASE', 'snaps')}?authSource=admin`,
      }),
      inject: [ConfigService],
    }),
    SnapsModule,
    SeedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
