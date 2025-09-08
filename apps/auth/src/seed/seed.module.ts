import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Snap.name, schema: SnapSchema }]),
    TypeOrmModule.forFeature([User]),
  ],

  providers: [SeedService],

  controllers: [SeedController],
})
export class SeedModule {}
