import { DynamicModule, Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedController } from './seed.controller';
import { Snap, SnapSchema } from '../snaps/schemas/snap.schema';

@Module({})
export class SeedModule {
  static register(): DynamicModule {
    const enableSeed =
      process.env.ENABLE_SEED === 'true' &&
      process.env.NODE_ENV !== 'production';

    return {
      module: SeedModule,
      imports: [
        MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
      ],
      providers: [SeedService],
      controllers: enableSeed ? [SeedController] : [],
    };
  }
}
