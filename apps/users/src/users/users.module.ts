import { Module, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { credentialsProtoOptions, storageProtoOptions } from 'proto';
import { SnapSeen } from './entities/snaps-seen.entity';
import { CREDENTIALS_GRPC, STORAGE_GRPC } from 'nowhere-common';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: STORAGE_GRPC,
        transport: Transport.GRPC,
        options: storageProtoOptions,
      },
      {
        name: CREDENTIALS_GRPC,
        transport: Transport.GRPC,
        options: credentialsProtoOptions,
      }
    ]),
    TypeOrmModule.forFeature([User, Settings, SnapSeen]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(private userService: UsersService) { }
  async onModuleInit() {
    await this.userService.seedAdmin();
  }
}
