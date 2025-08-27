import { Module } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from '../settings/entities/settings.entity';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    UsersModule,
    TypeOrmModule.forFeature([Settings]),
  ],
  controllers: [GrpcController],
  providers: [GrpcService],
  exports: [GrpcService],
})
export class GrpcModule {}
