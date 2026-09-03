import { Module } from '@nestjs/common';
import { SnapsModule } from './snaps/snaps.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  buildMongoUri,
  createEnvConfigModule,
  HealthModule,
  NatsClientModule,
} from 'nowhere-common';
import { SnapsEnvVariables } from './utils/snaps-env-variables';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    createEnvConfigModule(SnapsEnvVariables),
    NatsClientModule.register(),
    HealthModule.forMongoose(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: buildMongoUri(configService),
      }),
    }),
    SnapsModule,
    SeedModule.register(),
  ],
})
export class AppModule {}
