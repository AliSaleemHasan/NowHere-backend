import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Snap, SnapSchema } from 'src/snaps/snaps/schemas/snap.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { SeedController } from './seed.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
    TypeOrmModule.forFeature([User]),
  ],

  providers: [SeedService],

  controllers: [SeedController],
})
export class SeedModule {}
