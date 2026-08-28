import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageNatsController } from './controllers/storage.nats.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import {
  configuration,
  getValidateFn,
  NatsClientModule,
} from 'nowhere-common';
import { StroageEnvVariables } from './utils/storage-env-variables';
import {
  STORAGE_STRATEGY,
  S3StorageStrategy,
  GCSStorageStrategy,
} from './strategies';

@Module({
  imports: [
    NatsClientModule.register('NATS_CLIENT'),
    ConfigModule.forRoot({
      validate: getValidateFn(StroageEnvVariables),
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('CACHE_TTL') || 3600,
        stores: [new KeyvRedis(configService.get('REDIS_URL') || 'redis://redis:6379')],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StorageNatsController],
  providers: [
    {
      provide: STORAGE_STRATEGY,
      useFactory: (configService: ConfigService) => {
        const provider = configService
          .get<string>('STORAGE_PROVIDER', 'aws')
          .toLowerCase();
        if (
          provider === 'gcp' ||
          provider === 'gcs' ||
          provider === 'google'
        ) {
          return new GCSStorageStrategy(configService);
        }
        return new S3StorageStrategy(configService);
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService, STORAGE_STRATEGY],
})
export class StorageModule {}
