import { Module, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';
import { ClientsModule } from '@nestjs/microservices';
import { storageProtoOptions } from 'proto';
import { ClientOptions } from '@grpc/grpc-js';
import { SnapSeen } from './entities/snaps-seen.entity';

@Module({
  imports: [
    ClientsModule.register([
      { name: 'STORAGE', ...(storageProtoOptions as ClientOptions) },
    ]),
    TypeOrmModule.forFeature([User, Settings, SnapSeen]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(private userService: UsersService) {}
  async onModuleInit() {
    await this.userService.seedAdmin();
  }
}
