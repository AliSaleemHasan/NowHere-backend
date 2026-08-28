import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class NatsClientModule {
  static register(name: string = 'NATS_CLIENT'): DynamicModule {
    return {
      module: NatsClientModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              transport: Transport.NATS,
              options: {
                servers: [config.get<string>('NATS_URL', 'nats://nats:4222')],
              },
            }),
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
