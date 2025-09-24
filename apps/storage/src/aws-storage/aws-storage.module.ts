import { Module } from '@nestjs/common';
import { AwsStorageService } from './aws-storage.service';
import { AwsStorageController } from './aws-storage.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from 'nowhere-common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from '../s3ObjectProvider/s3-object.module';

@Module({
  imports: [
    S3Module,
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
        name: MICROSERVICES.STORAGE.package,
        transport: Transport.REDIS,
        options: {
          host: 'redis',
          port: Number(MICROSERVICES.STORAGE.redisPort || 6379),
        },
      },
    ]),
  ],
  providers: [AwsStorageService],
  exports: [AwsStorageService],
  controllers: [AwsStorageController],
})
export class AwsStorageModule {}
