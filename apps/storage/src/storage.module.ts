import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageNatsController } from './controllers/storage.nats.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { createEnvConfigModule, HealthModule } from 'nowhere-common';
import { StorageEnvVariables } from './utils/storage-env-variables';
import {
  STORAGE_STRATEGY,
  S3StorageStrategy,
  GCSStorageStrategy,
} from './strategies';
import { isGcpStorageProvider } from './utils/storage-provider';

@Module({
  imports: [
    createEnvConfigModule(StorageEnvVariables),
    HealthModule.forMemory(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('CACHE_TTL') || 3600,
        stores: [
          new KeyvRedis(
            configService.get('REDIS_URL') || 'redis://redis:6379',
          ),
        ],
      }),
    }),
  ],
  controllers: [StorageNatsController],
  providers: [
    {
      provide: STORAGE_STRATEGY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (isGcpStorageProvider(configService.get('STORAGE_PROVIDER'))) {
          return new GCSStorageStrategy(configService);
        }
        return new S3StorageStrategy(configService);
      },
    },
    StorageService,
  ],
  exports: [StorageService, STORAGE_STRATEGY],
})
export class StorageModule {}
