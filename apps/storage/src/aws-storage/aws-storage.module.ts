import { Module } from '@nestjs/common';
import { AwsStorageService } from './aws-storage.service';
import { AwsStorageController } from './aws-storage.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from 'common/constants';

@Module({
  imports: [
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
