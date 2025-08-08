import { Module } from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { SnapsController } from './snaps.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from './schemas/snap.schema';
import { AuthModule } from 'src/auth/auth.module';
import { SnapsGetaway } from './getaway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
    AuthModule,
  ],
  controllers: [SnapsController],
  providers: [SnapsService, SnapsGetaway],
})
export class SnapsModule {}
