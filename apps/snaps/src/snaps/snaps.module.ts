import { Module } from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { SnapsNatsController } from './controllers/snaps.nats.controller';
import { SnapsEventsController } from './controllers/snaps.events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { NatsClientModule } from 'nowhere-common';

@Module({
  imports: [
    NatsClientModule.register('NATS_CLIENT'),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsNatsController, SnapsEventsController],
  providers: [SnapsService, SnapsGateway],
  exports: [SnapsService],
})
export class SnapsModule {}
