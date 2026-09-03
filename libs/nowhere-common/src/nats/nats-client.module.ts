import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NATS_CLIENT } from '../constants';
import { natsConnectionOptions } from './nats-request';

@Module({})
export class NatsClientModule {
  static register(name: string = NATS_CLIENT): DynamicModule {
    return {
      module: NatsClientModule,
      global: true,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              transport: Transport.NATS,
              options: natsConnectionOptions(
                config.get<string>('NATS_URL', 'nats://nats:4222'),
              ),
            }),
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
