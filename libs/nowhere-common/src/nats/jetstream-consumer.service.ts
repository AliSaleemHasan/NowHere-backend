import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  NatsConnection,
  JetStreamClient,
  JSONCodec,
  AckPolicy,
  ConsumerMessages,
} from 'nats';
import { JETSTREAM_NC } from './jetstream-publisher.service';

export interface JetStreamSubscriptionConfig {
  /** Stream name (e.g. 'AUTH_EVENTS') */
  stream: string;
  /** Durable consumer name (e.g. 'users-auth-credentials') */
  consumer: string;
  /** Subject to filter on (e.g. 'auth.user.credentials.created') */
  filterSubject: string;
  /** Handler called for each message. Throw to NAK and redeliver. */
  handler: (data: any) => Promise<void>;
}

@Injectable()
export class JetStreamConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(JetStreamConsumerService.name);
  private readonly codec = JSONCodec();
  private readonly js: JetStreamClient;
  private readonly consumers: ConsumerMessages[] = [];

  constructor(@Inject(JETSTREAM_NC) private readonly nc: NatsConnection) {
    this.js = nc.jetstream();
  }

  /**
   * Subscribe to a JetStream subject using the modern Consumer API.
   * Messages are processed sequentially and acked on success / naked on failure.
   */
  async subscribe(config: JetStreamSubscriptionConfig): Promise<void> {
    const jsm = await this.nc.jetstreamManager();

    // Ensure the durable consumer exists (upsert)
    await jsm.consumers.add(config.stream, {
      durable_name: config.consumer,
      ack_policy: AckPolicy.Explicit,
      filter_subject: config.filterSubject,
    });

    // Retrieve the configured consumer
    const consumer = await this.js.consumers.get(config.stream, config.consumer);
    
    // Start consuming messages
    const messages = await consumer.consume();
    this.consumers.push(messages);

    this.logger.log(
      `Consumer "${config.consumer}" consuming from ${config.filterSubject} on stream ${config.stream}`,
    );

    // Process messages in background (non-blocking async IIFE)
    (async () => {
      for await (const msg of messages) {
        try {
          const data = this.codec.decode(msg.data);
          await config.handler(data);
          msg.ack();
          this.logger.debug(
            `Acked ${msg.subject} seq=${msg.seq} consumer=${config.consumer}`,
          );
        } catch (error: any) {
          this.logger.error(
            `Error processing ${msg.subject} seq=${msg.seq}: ${error.message}`,
            error.stack,
          );
          msg.nak();
        }
      }
    })();
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers) {
      await consumer.close();
    }
    this.logger.log('All JetStream consumers closed');
  }
}
