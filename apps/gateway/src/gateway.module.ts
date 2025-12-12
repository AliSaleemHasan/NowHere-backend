import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { credentialsProtoOptions } from '../../../libs/proto/proto-options';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    JwtModule.register({
      global: true,
    }),
    ClientsModule.register([
      {
        name: 'CREDENTIALS_PACKAGE',
        transport: Transport.GRPC,
        options: credentialsProtoOptions,
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
