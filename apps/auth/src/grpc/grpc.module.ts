import { Module } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    UsersModule,
  ],
  controllers: [GrpcController],
  providers: [GrpcService],
})
export class GrpcModule {}
