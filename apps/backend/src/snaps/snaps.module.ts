import { Module } from '@nestjs/common';
import { SnapsService } from './snaps/snaps.service';
import { SnapsController } from './snaps/snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './snaps/schemas/snap.schema';
import { SnapsGetaway } from './getaway';
import { AwsStorageService } from '../../../storage/src/aws-storage/aws-storage.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { MICROSERVICES } from 'common/constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES.USERS.package,
        transport: Transport.GRPC,
        options: {
          package: MICROSERVICES.USERS.package,
          protoPath: join(__dirname, '..', 'auth-user.proto'),
          url: `${MICROSERVICES.USERS.host}:${MICROSERVICES.USERS.grpcPort}`,
        },
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
