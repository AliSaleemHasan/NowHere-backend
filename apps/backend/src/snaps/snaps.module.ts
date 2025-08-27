import { Module } from '@nestjs/common';
import { SnapsService } from './snaps/snaps.service';
import { SnapsController } from './snaps/snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './snaps/schemas/snap.schema';
import { SnapsGetaway } from './getaway';
import { StorageService } from '../storage/storage.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from 'common/proto/auth-user';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTH_PACKAGE_NAME,
          protoPath: join(__dirname, '..', 'auth-user.proto'),
          url: 'nowhere-auth:50051',
        },
      },
    ]),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsController],
  providers: [SnapsService, SnapsGetaway, StorageService],
})
export class SnapsModule {}
