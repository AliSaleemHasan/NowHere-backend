import { Module } from '@nestjs/common';
import { SnapsNatsController } from './controllers/snaps.nats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { JwtModule } from '@nestjs/jwt';
import { SnapsCreateService } from './snaps-create.service';
import { SnapsDeleteService } from './snaps-delete.service';
import { SnapsExpiresBackfill } from './snaps-expires-backfill';
import { SnapsNearParamsService } from './snaps-near-params';
import { SnapsQueryService } from './snaps-query.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsNatsController],
  providers: [
    SnapsNearParamsService,
    SnapsQueryService,
    SnapsCreateService,
    SnapsDeleteService,
    SnapsExpiresBackfill,
    SnapsGateway,
  ],
})
export class SnapsModule {}
