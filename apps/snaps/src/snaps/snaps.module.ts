import { Module } from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { SnapsController } from './snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import {
  MICROSERVICES,
  STORAGE_GRPC,
  STORAGE_REDIS,
  USERS_GRPC,
} from 'nowhere-common';
import {
  credentialsProtoOptions,
  storageProtoOptions,
  usersProtoOptions,
} from 'proto';

@Module({
  imports: [
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: STORAGE_GRPC,
        transport: Transport.GRPC,
        options: storageProtoOptions,
      },

      {
        name: USERS_GRPC,
        transport: Transport.GRPC,
        options: usersProtoOptions,
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
  providers: [SnapsService, SnapsGateway],
})
export class SnapsModule {}
