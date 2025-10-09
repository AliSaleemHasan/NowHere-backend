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

@Module({
  imports: [
    ClientsModule.register([
      {
        name: STORAGE_GRPC,
        transport: Transport.GRPC,
        options: storageProtoOptions,
      },

      {
        name: AUTH_GRPC,
        transport:Transport.GRPC,
        options: authProtoOptions,
      },
      {
        name: STORAGE_REDIS,
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
