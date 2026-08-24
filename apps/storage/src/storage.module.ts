import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { StorageGrpcController } from './storage.grpc.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import {
  MICROSERVICES,
  configuration,
  getValidateFn,
} from 'nowhere-common';
import { StroageEnvVariables } from './utils/storage-env-variables';
import {
  STORAGE_STRATEGY,
  S3StorageStrategy,
  GCSStorageStrategy,
} from './strategies';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot({
      validate: getValidateFn(StroageEnvVariables),
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('CACHE_TTL'),
        stores: [new KeyvRedis('redis://redis:6379')],
      }),
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: MICROSERVICES.STORAGE.redis?.package || 'STORAGE_REDIS',
        transport: Transport.REDIS,
        options: {
          host: 'redis',
          port: Number(MICROSERVICES.STORAGE.redis?.redisPort) || 6379,
        },
      },
    ]),
  ],
  controllers: [StorageController, StorageGrpcController],
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
