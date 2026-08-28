import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedController } from './seed.controller';
import { Snap, SnapSchema } from '../snaps/schemas/snap.schema';
import { NatsClientModule } from 'nowhere-common';

@Module({
  imports: [
    NatsClientModule.register('NATS_CLIENT'),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {}
