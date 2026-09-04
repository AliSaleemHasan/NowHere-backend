import {
  Module,
  DynamicModule,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { connect, NatsConnection, RetentionPolicy, StorageType, nanos } from 'nats';
import { JetStreamPublisher, JETSTREAM_NC } from './jetstream-publisher.service';
import { JetStreamConsumerService } from './jetstream-consumer.service';
import { JETSTREAM_STREAMS } from './jetstream.config';
import { natsConnectionOptions } from './nats-request';

/**
 * Provides JetStream publisher and consumer services.
 *
 * Usage:
 *   imports: [JetStreamModule.forRoot()]
 *
 * This module:
 *  - Opens a dedicated NATS connection for JetStream
 *  - Ensures all configured streams exist on startup
 *  - Exports JetStreamPublisher and JetStreamConsumerService
 *
 * The existing NatsClientModule for Core NATS request-reply is unaffected.
 */
@Module({})
export class JetStreamModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JetStreamModule.name);

  constructor(
    @Inject(JETSTREAM_NC) private readonly nc: NatsConnection,
  ) {}

  static forRoot(): DynamicModule {
    return {
      module: JetStreamModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: JETSTREAM_NC,
          useFactory: async (config: ConfigService) => {
            const nc = await connect({
              ...natsConnectionOptions(
                config.get<string>('NATS_URL', 'nats://nats:4222'),
              ),
              name: 'jetstream-client',
            });
            return nc;
          },
          inject: [ConfigService],
        },
        JetStreamPublisher,
        JetStreamConsumerService,
      ],
      exports: [JetStreamPublisher, JetStreamConsumerService],
    };
  }

  async onModuleInit() {
    const jsm = await this.nc.jetstreamManager();

    for (const stream of JETSTREAM_STREAMS) {
      try {
        const info = await jsm.streams.info(stream.name);
        await jsm.streams.update(stream.name, {
          ...info.config,
          subjects: stream.subjects,
        });
        this.logger.log(
          `Stream "${stream.name}" updated with subjects [${stream.subjects.join(', ')}]`,
        );
      } catch {
        await jsm.streams.add({
          name: stream.name,
          subjects: stream.subjects,
          retention: RetentionPolicy.Limits,
          storage: StorageType.File,
          max_age: nanos((stream.maxAgeDays ?? 7) * 24 * 60 * 60 * 1000),
        });
        this.logger.log(
          `Stream "${stream.name}" created [${stream.subjects.join(', ')}]`,
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.nc.drain();
    this.logger.log('JetStream NATS connection drained');
  }
}
