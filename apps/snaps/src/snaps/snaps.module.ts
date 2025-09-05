import { Module } from '@nestjs/common';
import { SnapsService } from './snaps/snaps.service';
import { SnapsController } from './snaps/snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './snaps/schemas/snap.schema';
import { SnapsGetaway } from './getaway';
import { AwsStorageService } from '../../../storage/src/aws-storage/aws-storage.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { MICROSERVICES } from 'nowhere-common';
import { authProtoOptions } from '@app/proto/proto-options';
import { ClientOptions } from '@grpc/grpc-js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'auth',
        ...(authProtoOptions as ClientOptions),
      },

      {
        name: MICROSERVICES.STORAGE.package,
        transport: Transport.REDIS,
        options: {
          port: Number(MICROSERVICES.STORAGE.redisPort),
          host: 'redis',
        },
      },
    ]),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsController],
  providers: [SnapsService, SnapsGetaway, AwsStorageService],
})
export class SnapsModule {}
