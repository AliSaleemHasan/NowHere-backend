import { Module } from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { SnapsNatsController } from './controllers/snaps.nats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { JwtModule } from '@nestjs/jwt';
import { NatsClientModule } from 'nowhere-common';

@Module({
  imports: [
    NatsClientModule.register('NATS_CLIENT'),
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsNatsController],
  providers: [SnapsService, SnapsGateway],
  exports: [SnapsService],
})
export class SnapsModule {}
