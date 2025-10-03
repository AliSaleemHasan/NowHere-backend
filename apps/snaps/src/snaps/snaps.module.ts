import { Module } from '@nestjs/common';
import { SnapsService } from './snaps/snaps.service';
import { SnapsController } from './snaps/snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './snaps/schemas/snap.schema';
import { SnapsGetaway } from './getaway';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_GRPC,
  MICROSERVICES,
  STORAGE_GRPC,
  STORAGE_REDIS,
} from 'nowhere-common';
import { authProtoOptions, storageProtoOptions } from 'proto';
import { ClientOptions } from '@grpc/grpc-js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: STORAGE_GRPC,
        ...(storageProtoOptions as ClientOptions),
      },

      {
        name: AUTH_GRPC,
        ...(authProtoOptions as ClientOptions),
      },
      {
        name: MICROSERVICES.STORAGE.redis?.package || STORAGE_REDIS,
        transport: Transport.REDIS,
        options: {
          port: Number(MICROSERVICES.STORAGE.redis?.redisPort) || 6379,
          host: 'redis',
        },
      },
    ]),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsController],
  providers: [SnapsService, SnapsGetaway],
})
export class SnapsModule {}
