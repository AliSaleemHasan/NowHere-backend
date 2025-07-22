import { Module } from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { SnapsController } from './snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './schemas/snap.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  controllers: [SnapsController],
  providers: [SnapsService],
})
export class SnapsModule {}
