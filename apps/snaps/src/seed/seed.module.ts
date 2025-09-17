import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedController } from './seed.controller';
import { Snap, SnapSchema } from '../snaps/snaps/schemas/snap.schema';
import { ClientsModule } from '@nestjs/microservices';
import { ClientOptions } from '@grpc/grpc-js';
import { authProtoOptions } from 'proto';

@Module({
  imports: [
    ClientsModule.register({
      clients: [{ name: 'auth', ...(authProtoOptions as ClientOptions) }],
    }),
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {}
